#!/usr/bin/env bash
# DSH 全局安装升级
#
#   ./dsh-upgrade.sh                 升到最新版（按下面的 DIST_TAG 解析）
#   ./dsh-upgrade.sh --dry-run       只读预检，不改任何东西
#   ./dsh-upgrade.sh --rollback      回滚到最近一次升级前的状态
#
# 只改 ~/.dsh 与全局 npm 安装。不使用本仓库作为安装来源。

# ============================================================ CONFIG
# 日常只跑「./dsh-upgrade.sh」就行：升到哪个版本由下面的 DIST_TAG 决定，
# 不用改文件。要临时指定版本用命令行参数（--to / --dist-tag）。
# ============================================================

# 目标版本从哪个 npm dist-tag 解析。'' 表示不解析，只看 TARGET_VERSION。
#   newest next 与 latest 中取较大的那个——默认，拿来就能升到最新
#   next   只看预发布线的最新一版
#   latest 只看正式线的最新一版
DIST_TAG="newest"

# 固定目标版本。非空则直接用它，忽略 DIST_TAG。
# 需要抱住某一版时写这里，例如 "0.2.1-rc.5"；平时留空。
TARGET_VERSION=""

# 顺带把 dshmarket 升到指定版本。'' = 不动 dshmarket（推荐：宿主升级和
# 插件升级解耦，出问题好定位）。要升就写具体版本，例如 "1.73.7"。
MARKET_TARGET=""

# 本机 patch 里的 provider 条目；升级后拿它核对配置没被组合丢。
# 这是配置事实，不是版本事实——改了 cordis.patch.yml 就同步这里。
PROVIDERS="micu openrouter zai moonshotai-cn teamorouter opencode-go yovole dimagent-oauth"

# 等价于 --yes：不逐个确认。0 = 问，1 = 不问。
ASSUME_YES=0

# ============================================================
set -euo pipefail
umask 022

PROFILE_DIR="$HOME/.dsh/profiles/web"
PATCH="$PROFILE_DIR/cordis.patch.yml"
PKG="$PROFILE_DIR/package.json"
LOCK="$PROFILE_DIR/pnpm-lock.yaml"
WORKSPACE="$PROFILE_DIR/pnpm-workspace.yaml"
BACKUP_ROOT="$HOME/.dsh/backups"

FORBIDDEN_LOG='startup failed|disabling profile plugin|incompatible with dsh|Plugins waiting for services|pending \(waiting for service'

MODE="upgrade"
GIVEN_DIR=""
SMOKE_PID=""

# 取一个选项的取值：缺值或看起来像另一个 flag 都拒绝，避免 --to --yes 把 --yes 当版本号。
need_value() {
	local opt="$1" val="${2:-}"
	if [ -z "$val" ]; then
		echo "$opt 需要一个取值" >&2
		exit 2
	fi
	case "$val" in
	-*)
		echo "${opt} 缺少取值（后面跟的是 ${val}）" >&2
		exit 2
		;;
	esac
	printf '%s' "$val"
}

usage() {
	cat <<'EOF'
DSH 全局安装升级（版本无关）

  直接跑：./dsh-upgrade.sh
      升到文件头 DIST_TAG（默认 next）指向的最新版。日常只用这一条。

  ./dsh-upgrade.sh --dry-run                 只读预检，不改任何东西
  ./dsh-upgrade.sh --rollback [备份目录]      回滚（默认最近一次升级前）
  ./dsh-upgrade.sh --resume [备份目录]        本体已是目标版本，只补插件阶段
  ./dsh-upgrade.sh --yes                     不交互确认；预检全过才继续

  临时覆盖文件头的 CONFIG（不改文件）：
    --to 0.2.1-rc.5            指定版本
    --dist-tag latest          指定 dist-tag
    --market 1.73.7            顺带升级 dshmarket
    --providers "a b c"        覆盖 provider 核对清单
EOF
}

while [ "$#" -gt 0 ]; do
	case "$1" in
	--dry-run) MODE="dry-run" ;;
	--yes | -y) ASSUME_YES=1 ;;
	--to)
		TARGET_VERSION="$(need_value --to "${2:-}")"
		shift
		;;
	--dist-tag)
		DIST_TAG="$(need_value --dist-tag "${2:-}")"
		shift
		;;
	--market)
		MARKET_TARGET="$(need_value --market "${2:-}")"
		shift
		;;
	--providers)
		PROVIDERS="$(need_value --providers "${2:-}")"
		shift
		;;
	--resume)
		MODE="resume"
		if [ -n "${2:-}" ] && [ "${2#-}" = "$2" ]; then
			GIVEN_DIR="$2"
			shift
		fi
		;;
	--rollback)
		MODE="rollback"
		if [ -n "${2:-}" ] && [ "${2#-}" = "$2" ]; then
			GIVEN_DIR="$2"
			shift
		fi
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
RUN_DIR="$BACKUP_ROOT/dsh-upgrade-run-$STAMP"
SUMMARY="$RUN_DIR/summary.txt"
BACKUP_DIR=""
NPM_CACHE_DIR=""
CURRENT_VERSION=""
PREV_VERSION=""
PLUGINS_BEFORE=""
BUNDLES_BEFORE=""
HOST_ALREADY=0

step() { printf '\n\033[1m== %s\033[0m\n' "$*"; }
say() { printf '   %s\n' "$*"; }
warn() { printf '\033[33m   ! %s\033[0m\n' "$*"; }
ok() { printf '\033[32m   + %s\033[0m\n' "$*"; }
note() {
	[ -d "$RUN_DIR" ] && printf '   %s\n' "$*" >>"$SUMMARY" 2>/dev/null
	return 0
}

# 运行记录目录只在真的要动手时建；dry-run 与「已是最新」不留垃圾。
RUN_DIR_READY=0
ensure_run() {
	[ "$RUN_DIR_READY" = "1" ] && return 0
	mkdir -p "$RUN_DIR"
	: >"$SUMMARY" 2>/dev/null || true
	RUN_DIR_READY=1
}

fail() {
	ensure_run
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

# 插件清单与 bundle 清单都从 profile 的 package.json 现读。
# 写死这两份清单会随每次增删插件而静默过期；现读则永远等于磁盘真值。
profile_plugins() {
	node -e 'const p=require(process.argv[1]);console.log(Object.keys(p.dependencies||{}).join(" "))' "$PKG"
}
profile_bundles() {
	node -e 'const p=require(process.argv[1]);console.log((((p.dsh||{}).profile||{}).bundles||[]).join(" "))' "$PKG"
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
		warn "TERM 后仍在：${remaining}，改用 KILL"
		for pid in $remaining; do kill -9 "$pid" 2>/dev/null || true; done
		sleep 2
		remaining="$(dsh_web_pids)"
	fi
	[ -z "$remaining" ] || fail "还有 dsh web 没停掉：$remaining" \
		"若它由 launchd/pm2 托管，先停托管再看；不要留下守护进程自动拉起。"
	ok "dsh web 已全部停止"
}

# 探测 npm 缓存是否可写；坏则记下备用缓存，后续所有 npm 命令共用（不要 sudo）。
# 探测本身不建运行目录：只读模式下失败了才靠 fail() 补建，避免 dry-run 留垃圾。
probe_npm_cache() {
	local log
	log="$(mktemp -t dsh-upgrade-cache-probe)"
	if npm view @deepseek-ai/dsh version >/dev/null 2>"$log"; then
		rm -f "$log"
		return 0
	fi
	if grep -qE "EPERM|_cacache" "$log"; then
		warn "npm 缓存属主问题，后续 npm 命令改用备用缓存（不要 sudo）"
		NPM_CACHE_DIR="$HOME/.npm-cache-dsh"
	fi
	# 只读预检不该为一条探测日志建整个运行目录；有目录就归档，没有就只报路径。
	if [ -d "$RUN_DIR" ]; then
		cp "$log" "$RUN_DIR/npm-cache-probe.log" 2>/dev/null || true
		rm -f "$log"
	elif [ -s "$log" ]; then
		warn "npm 探测失败（网络或 registry），日志：${log}"
	fi
	return 0
}

npm_view() {
	if [ -n "$NPM_CACHE_DIR" ]; then
		npm view "$@" --cache "$NPM_CACHE_DIR"
	else
		npm view "$@"
	fi
}

npm_install_host() {
	ensure_run
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

# 只认本脚本建的备份：带 meta.txt 的才是，否则回滚不知道该退到哪一版。
latest_backup() {
	local d
	for d in $(find "$BACKUP_ROOT" -maxdepth 1 -name 'pre-upgrade-*' -type d 2>/dev/null | sort -r); do
		[ -f "$d/meta.txt" ] && {
			echo "$d"
			return 0
		}
	done
	return 0
}

# 解析目标版本：TARGET_VERSION（文件头或 --to）优先，其次按 DIST_TAG 向 registry 解析。
# DIST_TAG=newest 时取 next 与 latest 中较大的那个，这样“跑一下就到最新”不用改文件。
resolve_target() {
	if [ -n "$TARGET_VERSION" ] && ! printf '%s' "$TARGET_VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.]+)?$'; then
		fail "指定的版本号不合法：$TARGET_VERSION" \
			"期望形如 0.2.1-rc.5。"
	fi
	if [ -n "$TARGET_VERSION" ]; then
		say "目标版本（显式指定）  ${TARGET_VERSION}"
		return 0
	fi
	local tag="$DIST_TAG" resolved
	if [ "$tag" = "newest" ]; then
		# next 与 latest 取更大的那个；不碰 alpha 线，避免把测试版当默认目标。
		resolved="$(npm_view @deepseek-ai/dsh dist-tags --json 2>/dev/null |
			grep -oE '"(next|latest)"[[:space:]]*:[[:space:]]*"[^"]+"' |
			sed -E 's/.*"([^"]+)"$/\1/' |
			sort -V | tail -1 || true)"
	else
		resolved="$(npm_view @deepseek-ai/dsh "dist-tags.$tag" 2>/dev/null || true)"
		resolved="$(printf %s "$resolved" | head -1 | tr -d '"[:space:]')"
	fi
	if [ -z "$resolved" ]; then
		say "registry 上的 dist-tags："
		npm_view @deepseek-ai/dsh dist-tags --json 2>/dev/null >&2 || true
		fail "解析不到目标版本（dist-tag ${tag}）" \
			"用 --to <版本> 显式指定，或设置文件头 TARGET_VERSION。见 $RUN_DIR/npm-cache-probe.log。"
	fi
	TARGET_VERSION="$resolved"
	if ! printf '%s' "$TARGET_VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.]+)?$'; then
		fail "从 registry 解析到的不是合法版本号：${TARGET_VERSION}（dist-tag ${tag}）" \
			"用 --to <版本> 显式指定。"
	fi
	say "目标版本（dist-tag ${tag}）  $TARGET_VERSION"
}

# 写出本次运行的元信息；回滚靠它知道该退到哪一版
write_meta() {
	local dir="$1"
	cat >"$dir/meta.txt" <<EOF
prev_version=$PREV_VERSION
target_version=$TARGET_VERSION
market_target=$MARKET_TARGET
stamp=$STAMP
created=$(date -u +%Y-%m-%dT%H:%M:%SZ)
host=$(uname -s)
dsh_bin=$DSH_BIN
plugins=$PLUGINS_BEFORE
bundles=$BUNDLES_BEFORE
EOF
}

read_meta() {
	local f="$1/meta.txt"
	[ -f "$f" ] || return 1
	PREV_VERSION="$(sed -n 's/^prev_version=//p' "$f" | head -1)"
	[ -n "$PREV_VERSION" ]
}

# ---------------------------------------------------------------- 回滚

rollback() {
	local dir="$1" f
	[ -n "$dir" ] || dir="$(latest_backup)"
	if [ -z "$dir" ]; then
		local stale
		stale="$(find "$BACKUP_ROOT" -maxdepth 1 -name 'pre-upgrade-*' -type d 2>/dev/null | grep -v -F "${GIVEN_DIR:-/nonexistent}" | head -3 | tr '\n' ' ' || true)"
		[ -n "${stale// /}" ] &&
			warn "跳过了没有 meta.txt 的旧备份（无法得知该退到哪一版）：$stale"
		fail "没找到可用于回滚的 pre-upgrade-* 备份" \
			"本脚本只回滚自己建的、带 meta.txt 的备份；旧版脚本的备份请手工 npm i -g 并拷回四个文件。"
	fi
	[ -d "$dir" ] || fail "备份目录不存在：$dir"
	for f in cordis.patch.yml package.json pnpm-lock.yaml pnpm-workspace.yaml; do
		[ -f "$dir/$f" ] || fail "备份目录缺少 ${f}：$dir"
	done
	BACKUP_DIR="$dir"

	if ! read_meta "$dir"; then
		fail "备份目录没有 meta.txt，无法得知该退到哪一版：$dir" \
			"旧版脚本留下的备份（pre-rc3-*）不含 meta.txt；请手工 npm i -g @deepseek-ai/dsh@<版本> 并恢复四个文件。"
	fi

	step "回滚目标"
	say "备份：$dir"
	if [ "$(dsh_version || echo unknown)" = "$PREV_VERSION" ]; then
		say "本体已是 $PREV_VERSION，只回滚四个 profile 文件"
	else
		say "从 $(dsh_version || echo unknown) 回到 $PREV_VERSION"
	fi
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
	node -v >/dev/null 2>&1 || fail "node 不在 PATH"
	pnpm -v >/dev/null 2>&1 || fail "pnpm 不在 PATH（重装插件依赖需要它）"
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

[ -f "$PKG" ] || fail "找不到 $PKG" "profile 不存在或 HOME 不对；先确认 dsh web 能启动。"
PLUGINS_BEFORE="$(profile_plugins)"
BUNDLES_BEFORE="$(profile_bundles)"

probe_npm_cache

case "$MODE" in
upgrade)
	[ -n "$CURRENT_VERSION" ] || fail "读不到 dsh --version" "PATH 上的 dsh 不正常。"
	resolve_target
	PREV_VERSION="$CURRENT_VERSION"
	if [ "$CURRENT_VERSION" = "$TARGET_VERSION" ]; then
		# 宿主已最新：不要直接退出。若用户还指定了 --market，插件阶段仍有事要做。
		HOST_ALREADY=1
		if [ -z "$MARKET_TARGET" ]; then
			step "已是最新，无需升级"
			say "当前 ${CURRENT_VERSION} = 目标 ${TARGET_VERSION}，且未指定 --market"
			say "要重装同名版本：npm i -g @deepseek-ai/dsh@$TARGET_VERSION"
			say "要只跑插件阶段：$0 --resume"
			exit 0
		fi
		say "宿主已是 ${CURRENT_VERSION}，跳过本体阶段，只处理插件"
	else
		HOST_ALREADY=0
		say "升级路径  ${CURRENT_VERSION} → ${TARGET_VERSION}"
	fi
	note "target=$TARGET_VERSION host_already=$HOST_ALREADY"
	;;
resume)
	resolve_target
	[ "$CURRENT_VERSION" = "$TARGET_VERSION" ] || fail "--resume 要求当前已是 ${TARGET_VERSION}，实际 ${CURRENT_VERSION:-空}" \
		"没升到目标版本就不能只补插件阶段。"
	PREV_VERSION="$CURRENT_VERSION"
	;;
dry-run)
	resolve_target
	PREV_VERSION="$CURRENT_VERSION"
	;;
esac
ok "本体 ${CURRENT_VERSION:-?}"

step "阶段 0.2 已装插件"
progress=0
PLUGIN_COUNT=0
for p in $PLUGINS_BEFORE; do
	PLUGIN_COUNT=$((PLUGIN_COUNT + 1))
	v="$(plugin_version "$p")"
	printf '   %-44s %s\n' "$p" "$v"
	note "plugin $p=$v"
	[ "$v" = "missing" ] || progress=$((progress + 1))
done
[ "$PLUGIN_COUNT" -gt 0 ] || fail "$PKG 的 dependencies 是空的" "profile 清单异常，先修好再升。"
if [ "$progress" -ne "$PLUGIN_COUNT" ]; then
	fail "$PLUGIN_COUNT 个插件目录里只有 $progress 个在" \
		"本脚本不替你补装缺失插件；先 dsh plugin --profile web add <缺的包> 修好再升。"
fi
ok "$PLUGIN_COUNT 个插件目录都在"
say "bundle $PLUGIN_COUNT/${PLUGIN_COUNT}；bundles 共 $(printf '%s\n' $BUNDLES_BEFORE | wc -l | tr -d ' ') 项"

step "阶段 0.3 profile 元数据"
for f in "$PATCH" "$PKG" "$LOCK" "$WORKSPACE"; do
	[ -f "$f" ] || fail "缺少 $f"
	printf '   %-20s %7s B  %s\n' "$(basename "$f")" "$(bytes_of "$f")" "$(sha_of "$f")"
	note "hash $(basename "$f")=$(sha_of "$f")"
done
say ""
say "现值即本次基线：备份的是现值，验收也拿现值比，不再对照某个写死的快照。"

if [ "$MODE" != "resume" ]; then
	step "阶段 0.4 registry"
	if [ -n "$MARKET_TARGET" ]; then
		if ! printf '%s' "$MARKET_TARGET" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.]+)?$'; then
			fail "--market 的版本号不合法：${MARKET_TARGET}" "期望形如 1.73.7。"
		fi
		MARKET_HAS="$(npm_view "dshmarket@$MARKET_TARGET" version 2>/dev/null | tr -d '[:space:]\"' || true)"
		say "dshmarket@${MARKET_TARGET} = ${MARKET_HAS:-<查不到>}"
		[ "$MARKET_HAS" = "$MARKET_TARGET" ] || fail "registry 查不到 dshmarket@${MARKET_TARGET}" \
			"确认该版本已发布，或去掉 --market 不同时升插件。"
	else
		say "dshmarket 不动（未给 --market）"
	fi
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
	if [ -n "$CURRENT_VERSION" ] && [ "$CURRENT_VERSION" = "$TARGET_VERSION" ]; then
		say "注意：当前已是 ${TARGET_VERSION}，真跑会被拒绝；要补插件阶段用 --resume。"
	fi
	exit 0
fi

if [ "$MODE" = "resume" ]; then
	step "阶段 0.6 选择既有备份"
	BACKUP_DIR="$GIVEN_DIR"
	[ -n "$BACKUP_DIR" ] || BACKUP_DIR="$(latest_backup)"
	[ -n "$BACKUP_DIR" ] && [ -d "$BACKUP_DIR" ] || fail "找不到可用的 pre-upgrade-* 备份；用 --resume <目录> 指定"
	say "备份：$BACKUP_DIR"
	note "resume backup=$BACKUP_DIR"
	if [ -n "$(dsh_web_pids)" ]; then
		warn "dsh web 还在跑；对活宿主装插件可能触发 already-installed 拒绝"
		say "建议先停掉再继续；确认不停就靠 remove → add 兜底。"
		confirm "不停 web，直接继续？"
	fi
else
	ensure_run
	step "阶段 0.7 备份"
	BACKUP_DIR="$BACKUP_ROOT/pre-upgrade-$STAMP"
	mkdir -p "$BACKUP_DIR"
	cp "$PATCH" "$BACKUP_DIR/cordis.patch.yml"
	cp "$PKG" "$BACKUP_DIR/package.json"
	cp "$LOCK" "$BACKUP_DIR/pnpm-lock.yaml"
	cp "$WORKSPACE" "$BACKUP_DIR/pnpm-workspace.yaml"
	for f in cordis.patch.yml package.json pnpm-lock.yaml pnpm-workspace.yaml; do
		[ "$(sha_of "$BACKUP_DIR/$f")" = "$(sha_of "$PROFILE_DIR/$f")" ] ||
			fail "备份校验失败：$f 复制后哈希不一致" "磁盘可能在变动，重跑一次。"
	done
	write_meta "$BACKUP_DIR"
	ok "备份完成：$BACKUP_DIR"
	note "backup=$BACKUP_DIR"
fi

# ---------------------------------------------------------------- 阶段 1–2：宿主
HOST_ALREADY=0
if [ "$MODE" = "upgrade" ] && [ "$HOST_ALREADY" != "1" ]; then
	step "阶段 1 停止 dsh web"
	if [ -n "$(dsh_web_pids)" ]; then
		confirm "停掉 $(dsh_web_pids | tr '\n' ' ')？当前浏览器会话会断开。"
		stop_all_dsh_web
	else
		ok "没有需要停的 dsh web"
	fi

	step "阶段 2 升级本体 → $TARGET_VERSION"
	npm_install_host "$TARGET_VERSION" || fail "npm i -g 失败" "见 $RUN_DIR/npm-install.log"

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
	if grep -qE "failed to load|cannot" "$RUN_DIR/config.err"; then
		fail "--dump-config 报解析错误" "见 $RUN_DIR/config.err；先回滚。"
	fi
	missing=""
	PROVIDER_COUNT="$(printf '%s\n' $PROVIDERS | wc -l | tr -d ' ')"
	for provider in $PROVIDERS; do
		grep -q "$provider" "$RUN_DIR/config.yml" || missing="$missing $provider"
	done
	[ -z "$missing" ] || fail "配置里找不到 provider:$missing" "patch 没被完整组合进去；见 $RUN_DIR/config.yml。"
	ok "组合通过，$PROVIDER_COUNT 个 provider 条目都在"

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
		if ! kill -0 "$SMOKE_PID" 2>/dev/null; then
			break
		fi
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

if [ -n "$MARKET_TARGET" ]; then
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
		warn "pnpm 发版冷却拦住了 ${MARKET_TARGET}，把版本补进 minimumReleaseAgeExclude"
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

	step "阶段 3.2 验证 dshmarket"
	MARKET_NOW="$(plugin_version dshmarket)"
	say "dshmarket = $MARKET_NOW"
	[ "$MARKET_NOW" = "$MARKET_TARGET" ] || fail "dshmarket 是 ${MARKET_NOW}，不是 $MARKET_TARGET"
else
	MARKET_NOW="$(plugin_version dshmarket)"
	say "dshmarket 保持 ${MARKET_NOW}（未给 --market）"
fi

step "阶段 3.3 插件与 bundle 清单未被增删"
PLUGINS_AFTER="$(profile_plugins)"
note "plugins_after=$PLUGINS_AFTER"
for p in $PLUGINS_BEFORE; do
	printf '%s\n' $PLUGINS_AFTER | grep -qx -- "$p" || fail "升级后 dependencies 少了 $p" \
		"不要手工编辑依赖；先 remove 再 add。"
done
for p in $PLUGINS_AFTER; do
	printf '%s\n' $PLUGINS_BEFORE | grep -qx -- "$p" || warn "升级后 dependencies 多出 ${p}（预期外的新增）"
done
BUNDLES_MISSING=""
for bundle in $BUNDLES_BEFORE; do
	node -e 'const p=require(process.argv[1]);if(!((p.dsh&&p.dsh.profile&&p.dsh.profile.bundles)||[]).includes(process.argv[2]))process.exit(1)' \
		"$PKG" "$bundle" || BUNDLES_MISSING="$BUNDLES_MISSING $bundle"
done
for bundle in $(profile_bundles); do
	printf '%s\n' $BUNDLES_BEFORE | grep -qx -- "$bundle" || warn "升级后 bundles 多出 ${bundle}（预期外的新增）"
done
BUNDLE_COUNT="$(printf '%s\n' $BUNDLES_BEFORE | wc -l | tr -d ' ')"
[ -z "$BUNDLES_MISSING" ] || fail "dsh.profile.bundles 少了:$BUNDLES_MISSING" \
	"不要手工编辑 bundles；对该包先 remove 再 add。"
ok "$BUNDLE_COUNT 个 bundle 都在，依赖清单未被增删"

step "阶段 3.4 配置未被改写"
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
   插件      dshmarket=${MARKET_NOW}（其余 $(($(printf '%s\n' $PLUGINS_BEFORE | wc -l | tr -d ' ') - 1)) 个未动）
   备份      $BACKUP_DIR
   运行记录  $RUN_DIR

   启动：  dsh web --no-open

   启动后逐项验收（阻断级任一失败就回滚）：
     1. 新建会话发一句，能收到回复
     2. 侧栏在、文件树能展开、终端面板能跑 echo ok
     3. 设置能打开
     4. 让 Agent 跑一个需要审批的命令，批准/拒绝都生效
     5. 模型选择器里 $PROVIDER_COUNT 个自定义 provider 组 + 内置 DeepSeek 都在

   回滚：  $0 --rollback $BACKUP_DIR

EOF
note "DONE version=$(dsh_version) market=$MARKET_NOW"
