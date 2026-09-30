#!/usr/bin/env bash
# upgrade-dsh-global.sh — 全局安装的 @deepseek-ai/dsh CLI 安全升级脚本。
#
# FAQ:_faq_on_digested/18_global-dsh-upgrade/(事实链、检查清单与回滚说明都在那里)。
#
# 用法:
#   bash upgrade-dsh-global.sh              # 交互模式:每个关键动作逐项确认
#   bash upgrade-dsh-global.sh --dry-run    # 只做全部检查并打印将执行的命令,不安装
#   bash upgrade-dsh-global.sh --yes        # 免确认模式;sudo 修复等需要人在场的动作不自动执行
#
# 固定策略:只升 dist-tag latest(最新 RC 或正式版),绝不碰 alpha 通道。
# 兼容 macOS 自带 bash 3.2:不用关联数组、不用 ${var,,} 等 bash 4+ 特性。
set -euo pipefail

PKG="@deepseek-ai/dsh"
TAG="latest"
# 发布到 npm 的包 metadata 目前不带 engines 字段(2026-09-30 观测),npm 不会替我们拦
# node 版本;缺失时用仓库根 package.json 的 engines.node 兜底。
DEFAULT_ENG_RANGE='^22.19.0 || >=24.0.0'

YES=0
DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    -y|--yes)     YES=1 ;;
    -n|--dry-run) DRY_RUN=1 ;;
    *) printf '未知参数:%s(支持 --yes / --dry-run)\n' "$arg" >&2; exit 2 ;;
  esac
done

# ---------- 输出与确认 -------------------------------------------------------

if [ -t 1 ]; then
  C_INFO=$'\033[36m'; C_OK=$'\033[32m'; C_WARN=$'\033[33m'; C_ERR=$'\033[31m'; C_OFF=$'\033[0m'
else
  C_INFO=''; C_OK=''; C_WARN=''; C_ERR=''; C_OFF=''
fi
info() { printf '%s▸%s %s\n' "$C_INFO" "$C_OFF" "$*"; }
ok()   { printf '%s✓%s %s\n' "$C_OK"   "$C_OFF" "$*"; }
warn() { printf '%s!%s %s\n' "$C_WARN" "$C_OFF" "$*"; }
err()  { printf '%s✗%s %s\n' "$C_ERR"  "$C_OFF" "$*" >&2; }
die()  { err "$*"; exit 1; }

confirm() {
  # confirm "问题" [y|n]:默认选项缺省为 y;无终端可读时视为拒绝。
  if [ "$YES" -eq 1 ] || [ "$DRY_RUN" -eq 1 ]; then return 0; fi
  local q="$1" def="${2:-y}" ans hint
  case "$def" in y) hint='[Y/n]' ;; n) hint='[y/N]' ;; *) hint='[y/n]' ;; esac
  printf '%s %s ' "$q" "$hint" > /dev/tty 2>/dev/null || return 1
  IFS= read -r ans < /dev/tty || return 1
  ans="${ans:-$def}"
  case "$ans" in y|Y|yes|Yes|YES) return 0 ;; *) return 1 ;; esac
}

# ---------- 版本比较 ---------------------------------------------------------

ver_ge() {
  # ver_ge A B:数值版本比较,A >= B 返回 0。只比较前三段,忽略 prerelease 后缀。
  awk -v a="$1" -v b="$2" 'BEGIN {
    split(a, A, /[.-]/); split(b, B, /[.-]/)
    for (i = 1; i <= 3; i++) {
      x = A[i] + 0; y = B[i] + 0
      if (x > y) exit 0
      if (x < y) exit 1
    }
    exit 0
  }'
}

clause_satisfies() {
  # 单个比较子句:返回 0 满足 / 1 不满足 / 2 语法不认识。
  local tok="$1" ver="$2" base rest bmaj bmin vmaj vmin
  case "$tok" in
    '*'|'x'|'X')
      return 0 ;;
    '>='*)
      ver_ge "$ver" "${tok#>=}" ;;
    '>'*)
      if ver_ge "$ver" "${tok#>}"; then
        if ver_ge "${tok#>}" "$ver"; then return 1; else return 0; fi
      fi
      return 1 ;;
    '<='*)
      ver_ge "${tok#<=}" "$ver" ;;
    '<'*)
      if ver_ge "${tok#<}" "$ver"; then
        if ver_ge "$ver" "${tok#<}"; then return 1; else return 0; fi
      fi
      return 1 ;;
    '^'*)
      base="${tok#^}"
      bmaj="${base%%.*}"
      case "$bmaj" in ''|*[!0-9]*) return 2 ;; esac
      if [ "$bmaj" -ge 1 ]; then
        # ^M.m.p(M>=1):同 major 且 >= base
        [ "${ver%%.*}" = "$bmaj" ] && ver_ge "$ver" "$base" && return 0
        return 1
      fi
      # ^0.m.p:同 major 且同 minor 且 >= base
      [ "$bmaj" = "0" ] || return 2
      [ "${ver%%.*}" = "0" ] || return 1
      [ "${ver#*.}" = "$ver" ] && return 1
      rest="${base#*.}"; bmin="${rest%%.*}"
      rest="${ver#*.}"; vmin="${rest%%.*}"; vmin="${vmin%%[!0-9]*}"; vmin="${vmin:-0}"
      [ "$bmin" = "$vmin" ] && ver_ge "$ver" "$base" && return 0
      return 1 ;;
    '~'*)
      base="${tok#~}"
      bmaj="${base%%.*}"
      case "$bmaj" in ''|*[!0-9]*) return 2 ;; esac
      rest="${base#*.}"; bmin="${rest%%.*}"
      case "$bmin" in ''|*[!0-9]*) return 2 ;; esac
      [ "${ver%%.*}" = "$bmaj" ] || return 1
      [ "${ver#*.}" = "$ver" ] && return 1
      rest="${ver#*.}"; vmin="${rest%%.*}"; vmin="${vmin%%[!0-9]*}"; vmin="${vmin:-0}"
      [ "$bmin" = "$vmin" ] && ver_ge "$ver" "$base" && return 0
      return 1 ;;
    [v0-9]*)
      case "$tok" in *[xX]) return 2 ;; esac
      base="${tok#v}"
      if ver_ge "$ver" "$base" && ver_ge "$base" "$ver"; then return 0; fi
      return 1 ;;
    *)
      return 2 ;;
  esac
}

node_satisfies() {
  # node_satisfies RANGE VERSION:返回 0 满足 / 1 不满足 / 2 存在不认识的语法。
  # 语义:按 || 分组,组间 OR;组内空格分隔的子句间 AND(如 ">=22.19.0 <23")。
  local range="$1" ver="$2" grp_list grp tok rc all_ok grp_unknown unknown=0
  ver="${ver#v}"
  range="${range//\"/}"
  case "$(printf '%s' "$range" | tr -d ' \t\n|')" in '') return 0 ;; esac
  grp_list="${range//||/$'\n'}"
  while IFS= read -r grp; do
    [ -z "$(printf '%s' "$grp" | tr -d ' \t')" ] && continue
    all_ok=1
    grp_unknown=0
    for tok in $grp; do
      rc=0
      clause_satisfies "$tok" "$ver" || rc=$?
      if [ "$rc" -eq 2 ]; then
        grp_unknown=1
        all_ok=0
      elif [ "$rc" -ne 0 ]; then
        all_ok=0
      fi
    done
    [ "$grp_unknown" -eq 1 ] && unknown=1
    if [ "$all_ok" -eq 1 ] && [ "$grp_unknown" -eq 0 ]; then
      return 0
    fi
  done <<EOF
$grp_list
EOF
  [ "$unknown" -eq 1 ] && return 2
  return 1
}

# ---------- 主流程 -----------------------------------------------------------

printf '\n'
info 'DSH 全局 CLI 升级脚本(策略:dist-tag '"$TAG"' = 最新 RC 或正式版)'
[ "$DRY_RUN" -eq 1 ] && warn 'dry-run 模式:只检查,不安装。'
printf '\n'

# 1. 基础工具 -----------------------------------------------------------------
command -v node > /dev/null 2>&1 || die '未找到 node —— 请先确认 nvm 环境已加载。'
command -v npm  > /dev/null 2>&1 || die '未找到 npm —— 请先确认 nvm 环境已加载。'
NODE_VER="$(node -v)"
ok "node $NODE_VER / npm $(npm -v)"

# 2. 安装方式与当前版本 ---------------------------------------------------------
NPM_GROOT="$(npm root -g 2>/dev/null || true)"
PNPM_GROOT=''
if command -v pnpm > /dev/null 2>&1; then PNPM_GROOT="$(pnpm root -g 2>/dev/null || true)"; fi
METHOD=''
GROOT=''
if [ -n "$NPM_GROOT" ] && [ -f "$NPM_GROOT/$PKG/package.json" ]; then
  METHOD='npm'; GROOT="$NPM_GROOT"
elif [ -n "$PNPM_GROOT" ] && [ -f "$PNPM_GROOT/$PKG/package.json" ]; then
  METHOD='pnpm'; GROOT="$PNPM_GROOT"
else
  err "在 npm/pnpm 全局目录下都没找到 $PKG。"
  DSH_BIN="$(command -v dsh 2>/dev/null || true)"
  [ -n "$DSH_BIN" ] && err "但 PATH 里有 dsh:$DSH_BIN —— 安装方式可能变了,先回来更新 FAQ 18。"
  exit 1
fi
OLD_VER="$(node -p "require('$GROOT/$PKG/package.json').version")"
ok "安装方式:$METHOD 全局($GROOT);当前版本 $OLD_VER"

# 3. 正在运行的 dsh 进程 --------------------------------------------------------
RUNNING="$(pgrep -fl "$PKG/" 2>/dev/null || true)"
if [ -n "$RUNNING" ]; then
  warn '检测到正在运行的 dsh 进程(升级会替换其安装目录,运行中的会话行为不可预期):'
  printf '%s\n' "$RUNNING" | sed 's/^/    /'
  confirm '仍要继续吗?' n || die '已取消。先结束上面的进程再跑本脚本。'
else
  ok '没有正在运行的 dsh 进程。'
fi

# 4. registry 可达性 + npm 缓存健康 ----------------------------------------------
CACHE_ARGS=()
npm_with_cache() { npm ${CACHE_ARGS+"${CACHE_ARGS[@]}"} "$@"; }
CACHE_NOTE='默认缓存(~/.npm)'
PROBE_ERR=''
probe_registry() {
  local out
  if out="$(npm_with_cache view "$PKG" version 2>&1)"; then
    PROBE_ERR=''
    return 0
  fi
  PROBE_ERR="$out"
  return 1
}

if ! probe_registry; then
  if printf '%s' "$PROBE_ERR" | grep -qiE 'EPERM|root-owned'; then
    warn 'npm 缓存目录里有 root 属主残留文件(老版本 npm 的已知 bug 遗留),写缓存会 EPERM。'
    info "修复命令:sudo chown -R \"$(id -u):$(id -g)\" \"$HOME/.npm\""
    if [ "$DRY_RUN" -eq 1 ]; then
      warn 'dry-run:不执行修复,检查继续走临时缓存旁路。'
    elif [ "$YES" -eq 1 ]; then
      warn '--yes 模式不自动执行 sudo;本次改用临时缓存目录。'
    elif confirm '现在就执行上面的 sudo 修复吗?(需要输密码)' n; then
      if sudo chown -R "$(id -u):$(id -g)" "$HOME/.npm"; then
        ok '缓存属主已修复。'
      else
        warn 'sudo 修复失败,本次改用临时缓存目录。'
      fi
    else
      info '跳过修复,本次改用临时缓存目录;永久修复请手动跑上面的 sudo 命令。'
    fi
  else
    die "无法访问 npm registry(非缓存权限问题)。错误摘要:$(printf '%s' "$PROBE_ERR" | head -n 3 | tr '\n' ' ')"
  fi
  if ! probe_registry; then
    if printf '%s' "$PROBE_ERR" | grep -qiE 'EPERM|root-owned'; then
      CACHE_DIR="${TMPDIR:-/tmp}/dsh-upgrade-cache"
      mkdir -p "$CACHE_DIR"
      CACHE_ARGS=(--cache "$CACHE_DIR")
      CACHE_NOTE="临时缓存 $CACHE_DIR"
      warn "npm 缓存仍不可写:本次所有 npm 操作改用 $CACHE_DIR。"
      probe_registry || die "换临时缓存后仍无法访问 registry:$PROBE_ERR"
    else
      die "无法访问 npm registry。错误摘要:$(printf '%s' "$PROBE_ERR" | head -n 3 | tr '\n' ' ')"
    fi
  else
    CACHE_NOTE='默认缓存(已修复)'
  fi
fi
ok "registry 可达(缓存:$CACHE_NOTE)"

# 5. 目标版本(dist-tag 通道)-----------------------------------------------------
TAGS_JSON="$(npm_with_cache view "$PKG" dist-tags --json 2>/dev/null)"
TAGS_FLAT="$(node -e 'const t=JSON.parse(process.argv[1]);for(const k of ["latest","next","alpha"])if(t[k])console.log(k+"="+t[k])' "$TAGS_JSON")"
get_tag() { printf '%s\n' "$TAGS_FLAT" | sed -n "s/^$1=//p"; }
TARGET="$(get_tag "$TAG")"
[ -n "$TARGET" ] || die "dist-tag $TAG 解析失败:$TAGS_FLAT"
ALPHA_TAG="$(get_tag alpha)"
if [ -n "$ALPHA_TAG" ] && [ "$ALPHA_TAG" != "$TARGET" ]; then
  info "dist-tags:$TAGS_FLAT —— 按策略只动 $TAG,alpha 通道($ALPHA_TAG)不会碰。"
else
  info "dist-tags:$TAGS_FLAT"
fi
ok "目标版本:$TARGET(dist-tag $TAG)"

# 6. node engines 校验 ----------------------------------------------------------
ENG_RANGE="$(npm_with_cache view "$PKG@$TARGET" engines.node --json 2>/dev/null || true)"
ENG_RANGE="${ENG_RANGE//\"/}"
ENG_SRC='npm metadata'
if [ -z "$(printf '%s' "$ENG_RANGE" | tr -d ' \t\n')" ]; then
  ENG_RANGE="$DEFAULT_ENG_RANGE"
  ENG_SRC="仓库默认(发布包 metadata 不带 engines 字段)"
fi
ENG_RC=0
node_satisfies "$ENG_RANGE" "$NODE_VER" || ENG_RC=$?
case "$ENG_RC" in
  0)
    ok "node $NODE_VER 满足 engines 要求($ENG_RANGE,来源:$ENG_SRC)" ;;
  2)
    warn "engines 范围 \"$ENG_RANGE\" 有本脚本不认识的语法,请人工确认 node $NODE_VER 是否满足。"
    confirm '继续升级吗?' n || die '已取消。' ;;
  *)
    die "node $NODE_VER 不满足目标版本要求 $ENG_RANGE。先用 nvm 升级(如:nvm install 24 && nvm use 24)再跑本脚本。" ;;
esac

# 7. 同版本短路 -----------------------------------------------------------------
if [ "$OLD_VER" = "$TARGET" ] && [ "$DRY_RUN" -eq 0 ]; then
  warn "当前已是 $TAG 通道指向的 $TARGET。"
  if ! confirm '仍要强制重装一遍吗?' n; then
    info '无事可做,退出。'
    exit 0
  fi
fi

# 8. 摘要确认 --------------------------------------------------------------------
printf '\n'
info '──────── 升级摘要 ────────'
printf '  安装方式  %s 全局(%s)\n' "$METHOD" "$GROOT"
printf '  版本      %s → %s(dist-tag %s)\n' "$OLD_VER" "$TARGET" "$TAG"
printf '  node      %s(engines:%s,来源:%s)\n' "$NODE_VER" "$ENG_RANGE" "$ENG_SRC"
printf '  npm 缓存  %s\n' "$CACHE_NOTE"
printf '\n'
confirm '确认执行升级?' n || die '已取消,未做任何改动。'

# 9. 安装 ------------------------------------------------------------------------
if [ "$DRY_RUN" -eq 1 ]; then
  info "[dry-run] 将执行:$METHOD 全局安装 $PKG@$TAG(以及第 10 步的全部校验)。"
else
  info '开始升级(可能需要几十秒)……'
  if [ "$METHOD" = 'npm' ]; then
    if ! npm_with_cache install -g "$PKG@$TAG"; then
      err 'npm install 失败。常见处置:'
      err "  1) 缓存权限:sudo chown -R \"$(id -u):$(id -g)\" \"$HOME/.npm\""
      err '  2) 网络/registry:npm config get registry 检查源与代理'
      exit 1
    fi
  else
    if ! pnpm add -g "$PKG@$TAG"; then
      err 'pnpm add 失败,请把上面的报错贴给 FAQ 18 的维护者。'
      exit 1
    fi
  fi
  ok '包管理器层安装完成。'
fi

# 10. 升级后校验 -------------------------------------------------------------------
if [ "$DRY_RUN" -eq 1 ]; then
  info "[dry-run] 升级后将校验:command -v dsh 可解析、dsh --version == $TARGET、dsh --help 冒烟。"
else
  hash -r 2>/dev/null || true
  DSH_BIN="$(command -v dsh 2>/dev/null || true)"
  [ -n "$DSH_BIN" ] || die '升级后 PATH 里找不到 dsh —— 检查全局 bin 目录是否在 PATH 里。'
  ok "dsh 可执行文件:$DSH_BIN"
  NEW_VER="$(dsh --version 2>/dev/null | head -n 1 | tr -d '[:space:]' || true)"
  [ -n "$NEW_VER" ] || die 'dsh --version 没有输出 —— 安装可能损坏,请用下面的回滚命令。'
  if [ "$NEW_VER" = "$TARGET" ]; then
    ok "dsh --version = $NEW_VER(与目标一致)"
  else
    warn "dsh --version 输出 $NEW_VER,与目标 $TARGET 不一致 —— 安装可能未生效,建议回滚后再查。"
  fi
  if dsh --help > /dev/null 2>&1; then
    ok 'dsh --help 冒烟通过。'
  else
    warn 'dsh --help 非零退出 —— 新版本可能需要迁移,先看下面的升级指南。'
  fi
fi

# 11. 收尾:回滚命令 + 升级指南 -------------------------------------------------------
printf '\n'
info '──────── 收尾 ────────'
if [ "$METHOD" = 'npm' ]; then
  info "回滚命令(如有问题):npm install -g $PKG@$OLD_VER"
else
  info "回滚命令(如有问题):pnpm add -g $PKG@$OLD_VER"
fi
info '用户数据在 ~/.dsh/,升级与回滚都不会动它。'

REPO_ROOT="${DSH_REPO:-}"
if [ -z "$REPO_ROOT" ]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd || true)"
  if [ -n "$SCRIPT_DIR" ] && [ -d "$SCRIPT_DIR/../../docs/upgrade-guide" ]; then
    REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
  fi
fi
if [ -n "$REPO_ROOT" ]; then
  if [ -d "$REPO_ROOT/docs/upgrade-guide/v$TARGET" ]; then
    warn "docs/upgrade-guide/ 有 v$TARGET 升级指南 —— 升级还没完,逐条过一遍:"
    ls -1 "$REPO_ROOT/docs/upgrade-guide/v$TARGET" | sed 's/^/    /'
  else
    info "本地 checkout($REPO_ROOT)的 docs/upgrade-guide/ 暂无 v$TARGET 条目;若本地落后,以 GitHub 仓库为准。"
  fi
else
  info '未找到本地 deepseek-harness checkout(可用 DSH_REPO=/path/to/repo 指定),请自行到仓库 docs/upgrade-guide/ 核对。'
fi

if [ "$DRY_RUN" -eq 1 ]; then
  ok 'dry-run 结束:以上仅为检查结果,未做任何改动。'
else
  ok "完成:$OLD_VER → ${NEW_VER:-$TARGET}。正在运行中的旧会话继续用旧代码,新开的会话用新代码。"
fi
