"""为内置食物数据集生成拼音字段（abbr 首字母 / pinyin 全拼）。

用法：
    python packages/core/scripts/gen_pinyin.py

依赖：
    pip install pypinyin

说明：
    脚本会就地改写 packages/core/src/data/foods.ts，为每条食物补上
    abbr（首字母缩写）和 pinyin（全拼）。名称与别名分别生成，多个值用空格分隔，
    search.ts 会按空格拆分后做前缀匹配。
"""

import re
from pathlib import Path

from pypinyin import Style, lazy_pinyin

TARGET = Path(__file__).resolve().parents[1] / "src" / "data" / "foods.ts"

NAME_RE = re.compile(r"name: '([^']+)'")
ALIAS_RE = re.compile(r"aliases: \[([^\]]*)\]")


def is_keep(ch: str) -> bool:
    return "\u4e00" <= ch <= "\u9fff" or ch.isascii() and ch.isalnum()


def clean(text: str) -> str:
    return "".join(ch for ch in text if is_keep(ch))


def to_abbr(text: str) -> str:
    cleaned = clean(text)
    if not cleaned:
        return ""
    return "".join(lazy_pinyin(cleaned, style=Style.FIRST_LETTER))


def to_pinyin(text: str) -> str:
    cleaned = clean(text)
    if not cleaned:
        return ""
    return "".join(lazy_pinyin(cleaned, style=Style.NORMAL))


def build_fields(name: str, aliases: list[str]) -> str:
    texts = [name, *aliases]
    abbrs, pinyins = [], []
    for text in texts:
        abbr = to_abbr(text)
        pinyin = to_pinyin(text)
        if abbr and abbr not in abbrs:
            abbrs.append(abbr)
        if pinyin and pinyin not in pinyins:
            pinyins.append(pinyin)
    return ", abbr: '%s', pinyin: '%s'" % (" ".join(abbrs), " ".join(pinyins))


def main() -> None:
    content = TARGET.read_text(encoding="utf-8")
    lines = content.split("\n")
    updated, count = [], 0

    for line in lines:
        name_match = NAME_RE.search(line)
        if not name_match or "abbr:" in line:
            updated.append(line)
            continue

        alias_match = ALIAS_RE.search(line)
        aliases = re.findall(r"'([^']+)'", alias_match.group(1)) if alias_match else []

        fields = build_fields(name_match.group(1), aliases)
        line = re.sub(r"(, origin: '[^']*')? \},$", fields + r"\1 },", line)
        if "abbr:" not in line:
            line = line.rstrip()
            if line.endswith("},"):
                line = line[:-2] + fields + " },"
        count += 1
        updated.append(line)

    TARGET.write_text("\n".join(updated), encoding="utf-8")
    print("done: %d foods updated -> %s" % (count, TARGET))


if __name__ == "__main__":
    main()
