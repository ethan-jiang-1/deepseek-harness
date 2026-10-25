#!/usr/bin/env bash
# DSH 全局安装升级：0.2.1-rc.2 → 0.2.1-rc.3
#
#   ./rc3-upgrade.sh --dry-run              只做只读预检，不改任何东西
#   ./rc3-upgrade.sh                        完整升级（破坏性步骤前逐个确认）
#   ./rc3-upgrade.sh --yes                  同上但不问；预检全过才继续
#   ./rc3-upgrade.sh --resume [备份目录]     宿主已升到 rc.3、只想补插件阶段
#   ./rc3-upgrade.sh --rollback <备份目录>   回滚
#
# 只改 ~/.dsh 与全局 npm 安装。不使用本仓库作为安装来源。
set -euo pipefail
umask 022

TARGET_VERSION="0.2.1-rc.3"
PREV_VERSION="0.2.1-rc.2"
MARKET_TARGET="1.70.2"

PROFILE_DIR="$HOME/.dsh/profiles/web"
PATCH="$PROFILE_DIR/cordis.patch.yml"
PKG="$PROFILE_DIR/package.json"
LOCK="$PROFILE_DIR/pnpm-lock.yaml"
WORKSPACE="$PROFILE_DIR/pnpm-workspace.yaml"
BACKUP_ROOT="$HOME/.dsh/backups"

EXPECTED_PATCH_SHA="0584e3be8b8eaaeed7e697f53ec930cae554935612bcaef7db5320e8eaa5e27c"
EXPECTED_PKG_SHA="f450fc264c782ae27e467b085427e15952dc25513e1804900e37d10fa13831f2"
EXPECTED_LOCK_SHA="1a4938015e13f0ed989bfcfc7600d3b14d51add3c7614ed26222688a846628a7"
EXPECTED_WORKSPACE_SHA="3731ceb4387711887c8ce161ebedb04edea6e3235a5d9dcb0bdbee19592c1d4f"

MANAGED_PLUGINS="dsh-better-sidebar @quill507/dsh-auto-approval-llm dshmarket @linxin666/dsh-client-ui-skill-explorer @cerbur/clutch-dsh-worktree @arcships/dsh-dim-oauth dsh-client-auto-continue"
BUNDLES="@deepseek-ai/dsh-base @deepseek-ai/dsh-web-app dshmarket dsh-better-sidebar @quill507/dsh-auto-approval-llm dsh-client-auto-continue @arcships/dsh-dim-oauth @cerbur/clutch-dsh-worktree @linxin666/dsh-client-ui-skill-explorer"
PROVIDERS="micu openrouter zai moonshotai-cn teamorouter opencode-go yovole dimagent-oauth"

FORBIDDEN_LOG='startup failed|disabling profile plugin|incompatible with dsh|Plugins waiting for services|pending \(waiting for service'

MODE="upgrade"
ASSUME_YES=0
GIVEN_DIR=""
SMOKE_PID=""

usage() { sed -n '2,10p' "$0"; }

while [ "$#" -gt 0 ]; do
	case "$1" in
	--dry-run) MODE="dry-run" ;;
	--yes | -y) ASSUME_YES=1 ;;
	--resume)
		MODE="resume"
		[ -n "${2:-}" ] && [ "${2#-}" = "$2" ] && {
			GIVEN_DIR="$2"
			shift
		}
		;;
	--rollback)
		MODE="rollback"
		[ -n "${2:-}" ] && [ "${2#-}" = "$2" ] && GIVEN_DIR="$2" && shift
		;;
	-h | --help)
		usage
		exit 0
		;;
	*)
		echo "未知参数：$1（用 --help 看用法）" >&2
		exit 2
		;;
	esac
	shift
done

STAMP="$(date +%Y%m%d-%H%M%S)"
RUN_DIR="$BACKUP_ROOT/rc3-run-$STAMP"
SUMMARY="$RUN_DIR/summary.txt"
BACKUP_DIR=""
BASELINE_DRIFT=0
NPM_CACHE_DIR=""
step() { printf '\n\033[1m== %s\033[0m\n' "$*"; }
say() { printf '   %s\n' "$*"; }
warn() { printf '\033[33m   ! %s\033[0m\n' "$*"; }
ok() { printf '\033[32m   + %s\033[0m\n' "$*"; }
note() { printf '   %s\n' "$*" >>"$SUMMARY" 2>/dev/null || true; }

mkdir -p "$RUN_DIR"
: >"$SUMMARY" 2>/dev/null || true

fail() {
	printf '\n\033[31m== 停止：%s\033[0m\n' "$1" >&2
	[ -n "${2:-}" ] && printf '   %s\n' "$2" >&2
	note "FAILED: $1"
	printf '\n   运行记录：%s\n' "$RUN_DIR" >&2
	if [ -n "$BACKUP_DIR" ]; then
		printf '   回滚：%s --rollback %s\n' "$0" "$BACKUP_DIR" >&2
	fi
	exit 1
}

confirm() {
	[ "$ASSUME_YES" = "1" ] && return 0
	if [ ! -t 0 ]; then
		printf '\n\033[31m   需要确认「%s」，但标准输入不是终端。\033[0m\n' "$1" >&2
		printf '   在终端里重跑，或显式加 --yes。\n' >&2
		exit 3
	fi
	printf '\n\033[36m   %s [y/N] \033[0m' "$1"
	local answer=""
	read -r answer || answer=""
	case "$answer" in y | Y | yes | YES) return 0 ;; *)
		echo "   已取消（未做任何改动）"
		exit 0
		;;
	esac
}

sha_of() { shasum -a 256 "$1" | cut -d' ' -f1; }
bytes_of() { wc -c <"$1" | tr -d ' '; }
dsh_version() { dsh --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9.]+)?' | head -1 || true; }
plugin_version() {
	node -p "require('$PROFILE_DIR/node_modules/$1/package.json').version" 2>/dev/null || echo "missing"
}

DSH_BIN=""
resolve_dsh_bin() {
	DSH_BIN="$(command -v dsh 2>/dev/null || true)"
	[ -n "$DSH_BIN" ] || fail "PATH 里找不到 dsh"
	# 只解析目录到真实路径；进程 ps 里显示的是 bin 下的符号链接路径，保留原名才能命中
	DSH_BIN="$(cd "$(dirname "$DSH_BIN")" && pwd)/$(basename "$DSH_BIN")"
}

# 找出正在跑「本机全局安装的 dsh web」的进程。按 argv 扫而不是按端口，
# 因为同一个安装可以在任意端口起多个实例。
dsh_web_pids() {
	[ -n "$DSH_BIN" ] || return 0
	ps -Ao pid=,command= | awk -v bin="$DSH_BIN" -v self="$$" '
		$1 == self { next }
		index($0, bin " web") == 0 { next }
		$2 == "grep" || $2 == "awk" || $2 == "sed" { next }
		{ print $1 }
	' || true
}

describe_pids() {
	local pid port args
	for pid in $1; do
		args="$(ps -o command= -p "$pid" 2>/dev/null | cut -c1-110 || true)"
		port="$(lsof -nP -p "$pid" -a -iTCP -sTCP:LISTEN 2>/dev/null | awk 'NR>1 { print $9 }' | tr '\n' ' ' || true)"
		printf '   %-7s %s\n' "PID $pid" "${args:-<已退出>}"
		[ -n "${port// /}" ] && printf '   %-7s listen=%s\n' "" "$port"
		[ -n "${port// /}" ] && note "web pid=$pid listen=$port"
	done
}

ancestor_pids() {
	local pid="$PPID"
	while [ -n "$pid" ] && [ "$pid" != "0" ] && [ "$pid" != "1" ]; do
		echo "$pid"
		pid="$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ' || true)"
	done
}

# 铁律 2：执行者不能是被升级的那个进程（或它的后代）
guard_not_inside_dsh_web() {
	local target ancestor t
	target="$(dsh_web_pids)"
	[ -z "$target" ] && return 0
	for ancestor in $(ancestor_pids); do
		for t in $target; do
			if [ "$ancestor" = "$t" ]; then
				fail "当前 shell 是 dsh web (PID $t) 的后代进程" \
					"请在独立终端里运行；在这个会话里跑会把自己杀掉。"
			fi
		done
	done
}

stop_all_dsh_web() {
	local pids remaining pid
	pids="$(dsh_web_pids)"
	[ -z "$pids" ] && {
		ok "没有需要停的 dsh web"
		return 0
	}
	say "正在停：$pids"
	for pid in $pids; do kill "$pid" 2>/dev/null || true; done
	remaining=""
	for _ in 1 2 3 4 5 6 7 8 9 10; do
		remaining="$(dsh_web_pids)"
		[ -z "$remaining" ] && break
		sleep 1
	done
	if [ -n "$remaining" ]; then
		warn "TERM 后仍在：$remaining，改用 KILL"
		for pid in $remaining; do kill -9 "$pid" 2>/dev/null || true; done
		sleep 2
		remaining="$(dsh_web_pids)"
	fi
	[ -z "$remaining" ] || fail "还有 dsh web 没停掉：$remaining" \
		"若它由 launchd/pm2 托管，先停托管再看；不要留下守护进程自动拉起。"
	ok "dsh web 已全部停止"
}

# 探测 npm 缓存是否可写；坏则记下备用缓存，后续所有 npm 命令共用（不要 sudo）
probe_npm_cache() {
	local log="$RUN_DIR/npm-cache-probe.log"
	if npm view @deepseek-ai/dsh version >/dev/null 2>"$log"; then
		return 0
	fi
	if grep -qE "EPERM|_cacache" "$log"; then
		warn "npm 缓存属主问题，后续 npm 命令改用备用缓存（不要 sudo）"
		NPM_CACHE_DIR="$HOME/.npm-cache-dsh"
	fi
	return 0
}

# 带备用缓存参数（如已探测到缓存属主问题）跑一次 npm view
npm_view() {
	if [ -n "$NPM_CACHE_DIR" ]; then
		npm view "$@" --cache "$NPM_CACHE_DIR"
	else
		npm view "$@"
	fi
}

npm_install_host() {
	local version="$1" log="$RUN_DIR/npm-install.log" status
	set +e
	if [ -n "$NPM_CACHE_DIR" ]; then
		npm i -g "@deepseek-ai/dsh@$version" --cache "$NPM_CACHE_DIR" 2>&1 | tee "$log"
	else
		npm i -g "@deepseek-ai/dsh@$version" 2>&1 | tee "$log"
	fi
	status="${PIPESTATUS[0]}"
	set -e
	[ "$status" -eq 0 ] && return 0
	if [ -z "$NPM_CACHE_DIR" ] && grep -qE "EPERM|_cacache" "$log"; then
		warn "npm 缓存属主问题，改用备用缓存重试（不要 sudo）"
		NPM_CACHE_DIR="$HOME/.npm-cache-dsh"
		set +e
		npm i -g "@deepseek-ai/dsh@$version" --cache "$NPM_CACHE_DIR" 2>&1 | tee -a "$log"
		status="${PIPESTATUS[0]}"
		set -e
		[ "$status" -eq 0 ] && return 0
	fi
	return "$status"
}

latest_backup() {
	find "$BACKUP_ROOT" -maxdepth 1 -name 'pre-rc3-*' -type d 2>/dev/null | sort | tail -1
}

# ---------------------------------------------------------------- 回滚

rollback() {
	local dir="$1" f
	[ -n "$dir" ] || dir="$(latest_backup)"
	[ -n "$dir" ] || fail "没找到任何 pre-rc3-* 备份；手工指定：--rollback <目录>"
	[ -d "$dir" ] || fail "备份目录不存在：$dir"
	for f in cordis.patch.yml package.json pnpm-lock.yaml pnpm-workspace.yaml; do
		[ -f "$dir/$f" ] || fail "备份目录缺少 $f：$dir"
	done
	BACKUP_DIR="$dir"

	step "回滚目标"
	say "备份：$dir"
	say "从 $(dsh_version || echo unknown) 回到 $PREV_VERSION"
	if [ "$(sha_of "$PATCH")" != "$(sha_of "$dir/cordis.patch.yml")" ]; then
		warn "当前 cordis.patch.yml 与备份不同——覆盖后，升级后做的配置改动会丢失"
		say "先看差异（只显示非注释行）："
		diff "$dir/cordis.patch.yml" "$PATCH" | grep -E '^[<>]' | grep -vE '^[<>][[:space:]]*#' | head -20 || true
	fi
	confirm "确认回滚？"

	step "回滚：停 dsh web"
	guard_not_inside_dsh_web
	stop_all_dsh_web

	step "回滚：恢复 $PREV_VERSION"
	npm_install_host "$PREV_VERSION" || fail "npm i -g 失败" "见 $RUN_DIR/npm-install.log"
	[ "$(dsh_version)" = "$PREV_VERSION" ] || fail "版本仍是 $(dsh_version)" "检查 which dsh 是否指向同一个前缀"
	ok "本体 $PREV_VERSION"

	step "回滚：恢复 profile 元数据"
	cp "$dir/cordis.patch.yml" "$PATCH"
	cp "$dir/package.json" "$PKG"
	cp "$dir/pnpm-lock.yaml" "$LOCK"
	cp "$dir/pnpm-workspace.yaml" "$WORKSPACE"
	[ "$(sha_of "$PATCH")" = "$(sha_of "$dir/cordis.patch.yml")" ] || fail "恢复后 patch 哈希仍不一致"
	ok "四个文件已恢复"

	step "回滚：按锁文件重装插件"
	(cd "$PROFILE_DIR" && pnpm install --frozen-lockfile) || fail "pnpm install 失败" \
		"改用逐条 dsh plugin --profile web add <包>@<旧版本> --save-exact"
	ok "插件依赖已恢复"

	step "回滚完成"
	say "启动：dsh web --no-open"
	say "升级期间写入的会话可能含旧版本不认识的事件，不要当成可靠历史继续加工。"
	note "ROLLED BACK to $PREV_VERSION from $dir"
}

if [ "$MODE" = "rollback" ]; then
	resolve_dsh_bin
	rollback "$GIVEN_DIR"
	exit 0
fi

# ---------------------------------------------------------------- 阶段 0：预检

step "阶段 0.1 环境"
node -v >/dev/null 2>&1 || fail "node 不在 PATH"
pnpm -v >/dev/null 2>&1 || fail "pnpm 不在 PATH（dsh plugin 依赖它）"
resolve_dsh_bin
CURRENT_VERSION="$(dsh_version)"
say "node     $(node -v)"
say "pnpm     $(pnpm -v)"
say "dsh      $DSH_BIN"
say "version  ${CURRENT_VERSION:-<空>}"
note "run=$STAMP mode=$MODE node=$(node -v) pnpm=$(pnpm -v) dsh=$DSH_BIN version=$CURRENT_VERSION"

case "$MODE" in
upgrade)
	[ "$CURRENT_VERSION" = "$PREV_VERSION" ] || fail "当前版本是 ${CURRENT_VERSION:-空}，不是 $PREV_VERSION" \
		"环境已被动过。已是 $TARGET_VERSION 就用 --resume；要退回就用 --rollback。"
	;;
resume)
	[ "$CURRENT_VERSION" = "$TARGET_VERSION" ] || fail "--resume 要求当前已是 $TARGET_VERSION，实际 ${CURRENT_VERSION:-空}" \
		"没升到目标版本就不能只补插件阶段。"
	;;
esac
ok "本体 ${CURRENT_VERSION:-?}"

if [ "$MODE" = "upgrade" ]; then
	step "阶段 0.2 已装插件"
	progress=0
	for p in $MANAGED_PLUGINS; do
		v="$(plugin_version "$p")"
		printf '   %-44s %s\n' "$p" "$v"
		note "plugin $p=$v"
		[ "$v" = "missing" ] || progress=$((progress + 1))
	done
	PLUGIN_COUNT="$(printf '%s\n' $MANAGED_PLUGINS | wc -l | tr -d ' ')"
	[ "$progress" -eq "$PLUGIN_COUNT" ] || fail "$PLUGIN_COUNT 个插件目录里只有 $progress 个在" \
		"本脚本不替你补装缺失插件；先把插件恢复原状再升级。"
	ok "$PLUGIN_COUNT 个插件目录都在"
fi

step "阶段 0.3 profile 元数据"
for f in "$PATCH" "$PKG" "$LOCK" "$WORKSPACE"; do
	[ -f "$f" ] || fail "缺少 $f"
	printf '   %-20s %7s B  %s\n' "$(basename "$f")" "$(bytes_of "$f")" "$(sha_of "$f")"
done

check_drift() {
	local file="$1" expected="$2" label="$3" actual
	actual="$(sha_of "$file")"
	note "hash $label=$actual"
	if [ "$actual" != "$expected" ]; then
		warn "$label 与 2026-10-25 基线不同（$(bytes_of "$file") B / ${actual:0:12}…）"
		BASELINE_DRIFT=1
	fi
}

if [ "$MODE" = "upgrade" ]; then
	check_drift "$PATCH" "$EXPECTED_PATCH_SHA" "cordis.patch.yml"
	check_drift "$PKG" "$EXPECTED_PKG_SHA" "package.json"
	check_drift "$LOCK" "$EXPECTED_LOCK_SHA" "pnpm-lock.yaml"
	check_drift "$WORKSPACE" "$EXPECTED_WORKSPACE_SHA" "pnpm-workspace.yaml"
	if [ "$BASELINE_DRIFT" = "1" ]; then
		say ""
		say "差异通常来自你升级后改过配置（例如换默认模型）。"
		say "本脚本以当前现值为基线：备份的是现值，最后验收也拿现值比。"
		confirm "接受当前值作为基线并继续？"
	else
		ok "四个文件与基线一致"
	fi
fi

if [ "$MODE" = "upgrade" ]; then
	step "阶段 0.4 registry"
	probe_npm_cache
	NEXT_TAG="$(npm_view @deepseek-ai/dsh dist-tags --json 2>/dev/null |
		node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).next||"")}catch{console.log("")}})' || true)"
	say "dist-tag next = ${NEXT_TAG:-<查不到>}"
	note "dist-tag next=$NEXT_TAG"
	[ "$NEXT_TAG" = "$TARGET_VERSION" ] || fail "registry 的 next 是 ${NEXT_TAG:-空}，不是 $TARGET_VERSION" \
		"网络/registry 问题（也可能 npm 缓存属主异常，见 $RUN_DIR/npm-cache-probe.log）。不要改用 latest：它仍是 $PREV_VERSION。"
	MARKET_HAS="$(npm_view "dshmarket@$MARKET_TARGET" version 2>/dev/null | tr -d '\n' || true)"
	say "dshmarket@$MARKET_TARGET = ${MARKET_HAS:-<查不到>}"
	[ "$MARKET_HAS" = "$MARKET_TARGET" ] || fail "registry 查不到 dshmarket@$MARKET_TARGET"
	ok "目标版本都在"
fi

step "阶段 0.5 运行中的 dsh web"
guard_not_inside_dsh_web
WEB_PIDS="$(dsh_web_pids)"
if [ -z "$WEB_PIDS" ]; then
	say "本机全局安装没有 dsh web 在跑"
	note "web: none"
else
	describe_pids "$WEB_PIDS"
fi

if [ "$MODE" = "dry-run" ]; then
	step "dry-run 结束：预检通过，未做任何改动"
	say "去掉 --dry-run 即执行升级。"
	exit 0
fi

if [ "$MODE" = "resume" ]; then
	step "阶段 0.6 选择既有备份"
	BACKUP_DIR="$GIVEN_DIR"
	[ -n "$BACKUP_DIR" ] || BACKUP_DIR="$(latest_backup)"
	[ -n "$BACKUP_DIR" ] && [ -d "$BACKUP_DIR" ] || fail "找不到可用的 pre-rc3-* 备份；用 --resume <目录> 指定"
	say "备份：$BACKUP_DIR"
	note "resume backup=$BACKUP_DIR"
else
	step "阶段 0.7 备份"
	BACKUP_DIR="$BACKUP_ROOT/pre-rc3-$STAMP"
	mkdir -p "$BACKUP_DIR"
	cp "$PATCH" "$BACKUP_DIR/cordis.patch.yml"
	cp "$PKG" "$BACKUP_DIR/package.json"
	cp "$LOCK" "$BACKUP_DIR/pnpm-lock.yaml"
	cp "$WORKSPACE" "$BACKUP_DIR/pnpm-workspace.yaml"
	for f in cordis.patch.yml package.json pnpm-lock.yaml pnpm-workspace.yaml; do
		[ "$(sha_of "$BACKUP_DIR/$f")" = "$(sha_of "$PROFILE_DIR/$f")" ] ||
			fail "备份校验失败：$f 复制后哈希不一致" "磁盘可能在变动，重跑一次。"
	done
	ok "备份完成：$BACKUP_DIR"
	note "backup=$BACKUP_DIR"
fi

# ---------------------------------------------------------------- 阶段 1–2：宿主

if [ "$MODE" = "upgrade" ]; then
	step "阶段 1 停止 dsh web"
	if [ -n "$(dsh_web_pids)" ]; then
		confirm "停掉 $(dsh_web_pids | tr '\n' ' ')？当前浏览器会话会断开。"
		stop_all_dsh_web
	else
		ok "没有需要停的 dsh web"
	fi

	step "阶段 2 升级本体 → $TARGET_VERSION"
	npm_install_host "next" || fail "npm i -g 失败" "见 $RUN_DIR/npm-install.log"

	step "阶段 2.1 验证本体"
	NEW_VERSION="$(dsh_version)"
	say "dsh --version = ${NEW_VERSION:-<空>}"
	[ "$NEW_VERSION" = "$TARGET_VERSION" ] || fail "版本是 ${NEW_VERSION:-空}，不是 $TARGET_VERSION" \
		"可能装到了别的 Node 前缀；检查 which dsh。回滚见下。"
	[ "$(dirname "$(command -v dsh)")" = "$(dirname "$DSH_BIN")" ] ||
		warn "which dsh 指向的前缀变了：$(command -v dsh)"
	ok "本体 $NEW_VERSION"

	step "阶段 2.2 配置组合检查（不挂载插件）"
	set +e
	dsh --profile web --dump-config >"$RUN_DIR/config.yml" 2>"$RUN_DIR/config.err"
	DUMP_STATUS="$?"
	set -e
	say "exit=$DUMP_STATUS  yaml_lines=$(wc -l <"$RUN_DIR/config.yml" | tr -d ' ')"
	[ "$DUMP_STATUS" -eq 0 ] || fail "--dump-config 退出码 $DUMP_STATUS" "见 $RUN_DIR/config.err；不要动插件，先回滚。"
	[ -s "$RUN_DIR/config.yml" ] || fail "--dump-config 输出为空" "见 $RUN_DIR/config.err；先回滚。"
	grep -qE "failed to load|cannot" "$RUN_DIR/config.err" &&
		fail "--dump-config 报解析错误" "见 $RUN_DIR/config.err；先回滚。"
	missing=""
	for provider in $PROVIDERS; do
		grep -q "$provider" "$RUN_DIR/config.yml" || missing="$missing $provider"
	done
	[ -z "$missing" ] || fail "配置里找不到 provider:$missing" "patch 没被完整组合进去；见 $RUN_DIR/config.yml。"
	ok "组合通过，7 个自定义 provider + dimagent-oauth 都在"

	step "阶段 2.3 启动冒烟"
	dsh web --no-open >"$RUN_DIR/smoke.log" 2>&1 &
	SMOKE_PID=$!
	trap 'kill "$SMOKE_PID" 2>/dev/null || true' EXIT
	URL=""
	for _ in $(seq 1 45); do
		URL="$(grep -oE 'dsh web: http://[^ ]+' "$RUN_DIR/smoke.log" 2>/dev/null | head -1 || true)"
		[ -n "$URL" ] && break
		kill -0 "$SMOKE_PID" 2>/dev/null || break
		sleep 2
	done
	if [ -z "$URL" ]; then
		tail -30 "$RUN_DIR/smoke.log" >&2 || true
		fail "90 秒内没有打印访问地址" "见 $RUN_DIR/smoke.log；不要动插件，先回滚。"
	fi
	say "$URL"
	note "smoke url=$URL"
	# URL 先于插件完全加载打印；等几秒让迟到的启动诊断落盘，再检查禁用关键字
	for _ in $(seq 1 4); do
		kill -0 "$SMOKE_PID" 2>/dev/null || break
		sleep 1
	done
	if grep -qE "$FORBIDDEN_LOG" "$RUN_DIR/smoke.log"; then
		grep -nE "$FORBIDDEN_LOG" "$RUN_DIR/smoke.log" >&2 || true
		fail "启动日志出现禁用关键字" "见 $RUN_DIR/smoke.log；不要动插件，先回滚。"
	fi
	kill "$SMOKE_PID" 2>/dev/null || true
	SMOKE_PID=""
	stop_all_dsh_web >/dev/null || true
	[ -z "$(dsh_web_pids)" ] || fail "冒烟进程没停干净" "手工停掉再继续。"
	ok "冒烟通过（无 startup failed / disabling / waiting for services）"
fi

# ---------------------------------------------------------------- 阶段 3：插件

step "阶段 3.1 升级 dshmarket → $MARKET_TARGET"
add_market() {
	local status
	set +e
	dsh plugin --profile web add "dshmarket@$MARKET_TARGET" --save-exact 2>&1 | tee "$RUN_DIR/add-dshmarket.log"
	status="${PIPESTATUS[0]}"
	set -e
	return "$status"
}

if add_market; then
	ok "dshmarket add 成功"
elif grep -qE "minimumReleaseAge" "$RUN_DIR/add-dshmarket.log"; then
	warn "pnpm 发版冷却拦住了 $MARKET_TARGET，把版本补进 minimumReleaseAgeExclude"
	node -e '
const fs = require("fs"), p = process.argv[1], v = process.argv[2];
const lines = fs.readFileSync(p, "utf8").split("\n");
let hit = false;
for (let i = 0; i < lines.length; i++) {
  if (/^\s*-\s+dshmarket@/.test(lines[i])) {
    if (!lines[i].split("||").some(s => s.trim().replace(/^[- ]*dshmarket@/, "") === v)) lines[i] += " || " + v;
    hit = true;
  }
}
if (!hit) { console.error("没有 dshmarket 的 minimumReleaseAgeExclude 行"); process.exit(1); }
fs.writeFileSync(p, lines.join("\n"));
console.log(lines.find(l => /^\s*-\s+dshmarket@/.test(l)));
' "$WORKSPACE" "$MARKET_TARGET" || fail "改写 pnpm-workspace.yaml 失败" \
		"手工把 $MARKET_TARGET 加到 dshmarket 那一行选择器末尾，再重跑本脚本。"
	add_market || fail "补冷却排除后 add 仍失败" "见 $RUN_DIR/add-dshmarket.log"
elif grep -qE "already-installed" "$RUN_DIR/add-dshmarket.log"; then
	warn "已装包被拒，改走 remove → add"
	dsh plugin --profile web remove dshmarket 2>&1 | tee "$RUN_DIR/remove-dshmarket.log" ||
		fail "remove 失败" "见 $RUN_DIR/remove-dshmarket.log"
	add_market || fail "remove 后 add 仍失败" "见 $RUN_DIR/add-dshmarket.log"
elif grep -qE "incompatible-version|allow-version|requires " "$RUN_DIR/add-dshmarket.log"; then
	fail "兼容检查拒绝了 $MARKET_TARGET" "不要用 allow-version 强行放行；先查版本判断。"
else
	fail "dshmarket add 失败" "见 $RUN_DIR/add-dshmarket.log"
fi

step "阶段 3.2 验证 profile"
MARKET_NOW="$(plugin_version dshmarket)"
say "dshmarket = $MARKET_NOW"
[ "$MARKET_NOW" = "$MARKET_TARGET" ] || fail "dshmarket 是 $MARKET_NOW，不是 $MARKET_TARGET"
BUNDLES_MISSING=""
for bundle in $BUNDLES; do
	node -e 'const p=require(process.argv[1]);if(!((p.dsh&&p.dsh.profile&&p.dsh.profile.bundles)||[]).includes(process.argv[2]))process.exit(1)' \
		"$PKG" "$bundle" || BUNDLES_MISSING="$BUNDLES_MISSING $bundle"
done
[ -z "$BUNDLES_MISSING" ] || fail "dsh.profile.bundles 少了:$BUNDLES_MISSING" \
	"不要手工编辑 bundles；对该包先 remove 再 add。"
ok "9 个 bundle 都在"

step "阶段 3.3 配置未被改写"
PATCH_NOW="$(sha_of "$PATCH")"
say "$(basename "$PATCH") $(bytes_of "$PATCH") B / ${PATCH_NOW:0:12}…"
[ "$PATCH_NOW" = "$(sha_of "$BACKUP_DIR/cordis.patch.yml")" ] ||
	fail "cordis.patch.yml 在升级过程中被改写了" "用备份覆盖回去，再检查 .bak- 残骸。"
PATCH_BAKS="$(find "$PROFILE_DIR" -maxdepth 1 -name 'cordis.patch.yml.bak-[0-9]*' -print 2>/dev/null || true)"
[ -z "$PATCH_BAKS" ] || warn "目录里有 .bak- 残骸：$(echo "$PATCH_BAKS" | tr '\n' ' ')"
ok "patch 与备份一致"

step "升级完成"
cat <<EOF

   本体      $PREV_VERSION → $(dsh_version)
   插件      dshmarket → $MARKET_NOW（其余 6 个未动）
   备份      $BACKUP_DIR
   运行记录  $RUN_DIR

   启动：  dsh web --no-open

   启动后逐项验收（前 5 项任一失败就回滚）：
     1. 新建会话发一句，能收到回复
     2. 侧栏在、文件树能展开、终端面板能跑 echo ok
     3. 设置能打开
     4. 让 Agent 跑一个需要审批的命令，批准/拒绝都生效
     5. 模型选择器里 7 个自定义 provider 组 + DimAgent + 内置 DeepSeek 都在

   回滚：  $0 --rollback $BACKUP_DIR

EOF
note "DONE version=$(dsh_version) market=$MARKET_NOW"
