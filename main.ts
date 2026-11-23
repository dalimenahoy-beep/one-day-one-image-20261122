// One Day, One Image — Sunday 22 November 2026.
//
// main.ts writes its embedded Python/PIL renderer (make_poster.py) to a temp
// file and runs it. The renderer draws "The World Gazette" front page for
// 22 November 2026 — masthead, the COP31 lead, eleven more stories grouped by
// region, a day-in-numbers box and a wire ticker — and writes the poster to
// /output/entry.png (or MAKEFUN_OUTPUT_DIR when set).
//
// No network, no clocks, no randomness: every run writes identical bytes.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const MAKE_POSTER_PY = String.raw`
import sys
from PIL import Image, ImageDraw, ImageFont

OUT_PATH = sys.argv[1]
PAGE_W = 1024
MARGIN = 28
CONTENT_W = PAGE_W - 2 * MARGIN
PAPER = (247, 243, 233)
INK = (18, 18, 18)
ACCENT = (150, 24, 24)
FAINT = (105, 100, 92)
RULE_SOFT = (198, 192, 180)
BOX_BG = (233, 227, 213)
WHITE = (250, 248, 242)
TICKER_BG = (12, 12, 12)
TICKER_LABEL = (255, 110, 110)

FONT_DIR = "/usr/share/fonts/truetype/dejavu/"
SERIF_BOLD = "DejaVuSerif-Bold.ttf"
SANS = "DejaVuSans.ttf"
SANS_BOLD = "DejaVuSans-Bold.ttf"

def load(name, size):
    return ImageFont.truetype(FONT_DIR + name, size)

img = Image.new("RGB", (PAGE_W, PAGE_W), PAPER)
pen = ImageDraw.Draw(img)

def wrap(text, font, max_width):
    lines = []
    current = ""
    for word in text.split():
        trial = word if not current else current + " " + word
        if pen.textlength(trial, font=font) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines

def draw_block(x, y, text, font, line_height, max_width, fill=INK):
    for line in wrap(text, font, max_width):
        pen.text((x, y), line, font=font, fill=fill)
        y += line_height
    return y

LEAD_HEADLINE = "COP31 Ends With No Deal as Fossil-Fuel Text Is Rejected"
LEAD_BODY = (
    "The COP31 climate summit in Antalya closed with no agreement after the "
    "European Union and some 130 parties rejected a draft text that omitted "
    "fossil fuels. Talks ran two days into overtime, making it the longest "
    "UN climate summit on record, and the fight over a fossil-fuel phase-out "
    "now rolls on unresolved into next year."
)

COLUMNS = [
    [
        ("EUROPE", [
            ("Strike Levels Dymer Block; Boy, 7, Pulled Alive From Rubble",
             "A Russian strike partly destroyed a five-storey apartment block "
             "in Dymer, Ukraine, killing at least 10 people, with 14 still "
             "missing. Rescuers pulled a seven-year-old boy alive from the "
             "rubble as the search went on through the night."),
        ]),
        ("MIDDLE EAST", [
            ("Iran Strike Hits Bahrain Plant; Tankers Ablaze Near Hormuz",
             "An Iranian strike hit a civilian industrial facility in "
             "Bahrain, injuring two people, one critically; Tehran said it "
             "had targeted US Patriot radars. Gulf states condemned the "
             "attack, and two supertankers were ablaze after hitting mines "
             "near Hormuz."),
            ("Power Station Fire Kills Four in Basra",
             "A fire at the Hartha power station in Basra, Iraq, killed "
             "four people and injured about 35 on Saturday, officials said, "
             "as crews battled the blaze at a key electricity plant."),
            ("Russian Corvette Merkury Sunk at Benghazi",
             "The Russian corvette Merkury was sunk at port in Benghazi, "
             "Libya, after a suspected Ukrainian sea-drone attack, a rare "
             "strike on a Russian warship far from the Black Sea."),
        ]),
    ],
    [
        ("AMERICAS", [
            ("Democrats Clinch 258 House Seats, Biggest Majority Since 1992",
             "Democrats secured at least 258 seats in the US House of "
             "Representatives after the North Carolina recount, giving the "
             "party its largest majority since 1992 and a firm grip on the "
             "chamber's agenda."),
            ("Cartel Boss 'El Chapo Isidro' Captured in Sinaloa Raid",
             "Mexican forces captured cartel boss 'El Chapo Isidro' in "
             "Sinaloa. Eleven people were killed in the raid, including "
             "four soldiers, in one of the year's biggest blows against "
             "the cartels."),
            ("Trump Proposes 10% Cap on Credit-Card Interest",
             "Donald Trump proposed capping credit-card interest rates at "
             "10 percent and signed an executive order on federal "
             "contractors, opening a new front in his push on the cost of "
             "borrowing."),
        ]),
        ("ASIA-PACIFIC", [
            ("AI Sell-Off Spreads Across Asia; Nikkei Slides 5.06%",
             "The global sell-off in artificial-intelligence stocks spread "
             "through Asian markets, with Japan's Nikkei 225 falling 5.06 "
             "percent as investors cut exposure to chip and tech names."),
        ]),
    ],
    [
        ("INDONESIA", [
            ("Candy Factory Fire in Banten: 3 Dead, 36 Missing",
             "Fire swept the PT Fonusa Agung Mulia candy factory in "
             "Cikande, Banten, killing three people and leaving about 36 "
             "missing. By Sunday, 24 body bags had been recovered as "
             "families waited for news of the missing."),
        ]),
        ("MARKETS & SCIENCE", [
            ("BepiColombo Enters Orbit Around Mercury",
             "The BepiColombo probe has entered orbit around Mercury, "
             "beginning its close-up study of the solar system's innermost "
             "planet after a long cruise through the inner solar system."),
            ("Crews Battle Blaze Aboard Cargo Ship Sparta II",
             "Firefighters continued their battle against the fire aboard "
             "the cargo ship Sparta II, working to keep the blaze from "
             "spreading through the vessel's holds."),
        ]),
    ],
]

NUMBERS = [
    "258 — House seats clinched by Democrats",
    "130+ — parties rejecting the COP31 text",
    "-5.06% — Nikkei close in the AI sell-off",
    "10% — Trump's proposed card-rate cap",
    "24 — body bags recovered in Banten",
    "7 — age of the boy rescued in Dymer",
]

TICKER_ITEMS = [
    "COP31 ends with no deal in Antalya",
    "Boy, 7, pulled alive from Dymer rubble",
    "Merkury sunk at Benghazi port",
    "Two tankers ablaze near Hormuz",
    "Democrats clinch 258 House seats",
    "El Chapo Isidro captured in Sinaloa",
    "BepiColombo orbits Mercury",
    "Nikkei falls 5.06% on AI sell-off",
]

f_date = load(SANS_BOLD, 14)
f_title = load(SERIF_BOLD, 63)
f_kicker = load(SANS_BOLD, 14)
f_lead_h = load(SERIF_BOLD, 37)
f_lead_b = load(SANS, 16)
f_region = load(SANS_BOLD, 13)
f_head = load(SANS_BOLD, 15)
f_body = load(SANS, 12)
f_num_h = load(SANS_BOLD, 13)
f_num = load(SANS, 12)
f_tick = load(SANS_BOLD, 12)

# Masthead
y = 16
pen.text((MARGIN, y), "ONE DAY, ONE IMAGE", font=f_date, fill=FAINT)
center = "SUNDAY 22 NOVEMBER 2026"
cw = pen.textlength(center, font=f_date)
pen.text(((PAGE_W - cw) / 2, y), center, font=f_date, fill=INK)
right = "ALL THE NEWS IN ONE PAGE"
rw = pen.textlength(right, font=f_date)
pen.text((PAGE_W - MARGIN - rw, y), right, font=f_date, fill=FAINT)
y += 24
pen.line([(MARGIN, y), (PAGE_W - MARGIN, y)], fill=INK, width=1)
y += 8
title = "The World Gazette"
tw = pen.textlength(title, font=f_title)
pen.text(((PAGE_W - tw) / 2, y), title, font=f_title, fill=INK)
y += 76
pen.line([(MARGIN, y), (PAGE_W - MARGIN, y)], fill=INK, width=3)
pen.line([(MARGIN, y + 5), (PAGE_W - MARGIN, y + 5)], fill=INK, width=1)
y += 16

# Lead story
pen.text((MARGIN, y), "WORLD — THE LEAD STORY", font=f_kicker, fill=ACCENT)
y += 22
y = draw_block(MARGIN, y, LEAD_HEADLINE, f_lead_h, 45, CONTENT_W)
y += 6
y = draw_block(MARGIN, y, LEAD_BODY, f_lead_b, 22, CONTENT_W)
y += 12
pen.line([(MARGIN, y), (PAGE_W - MARGIN, y)], fill=INK, width=1)
y += 14
GRID_TOP = y

COL_W = (CONTENT_W - 2 * 18) // 3
COL_XS = [MARGIN, MARGIN + COL_W + 18, MARGIN + 2 * (COL_W + 18)]

def draw_story(x, yy, headline, body):
    yy = draw_block(x, yy, headline, f_head, 19, COL_W)
    yy += 3
    yy = draw_block(x, yy, body, f_body, 16, COL_W)
    return yy + 12

def draw_region(x, yy, name, stories):
    pen.rectangle([x, yy, x + COL_W, yy + 24], fill=INK)
    pen.text((x + 7, yy + 5), name, font=f_region, fill=WHITE)
    yy += 32
    for headline, body in stories:
        yy = draw_story(x, yy, headline, body)
    return yy

def draw_numbers(x, yy, items):
    wrapped = [wrap(item, f_num, COL_W - 16) for item in items]
    box_h = 30 + sum(len(w) for w in wrapped) * 17 + 6
    pen.rectangle([x, yy, x + COL_W, yy + box_h], fill=BOX_BG)
    pen.text((x + 8, yy + 7), "THE DAY IN NUMBERS", font=f_num_h, fill=INK)
    ny = yy + 30
    for w in wrapped:
        for line in w:
            pen.text((x + 8, ny), line, font=f_num, fill=INK)
            ny += 17
    return yy + box_h

for dx in (COL_XS[1] - 9, COL_XS[2] - 9):
    pen.line([(dx, GRID_TOP), (dx, 946)], fill=RULE_SOFT, width=1)

bottoms = []
for idx, sections in enumerate(COLUMNS):
    yy = GRID_TOP
    for name, stories in sections:
        yy = draw_region(COL_XS[idx], yy, name, stories)
    bottoms.append(yy)
draw_numbers(COL_XS[2], bottoms[2] + 2, NUMBERS)

# Wire ticker
TICKER_TOP = 950
pen.rectangle([0, TICKER_TOP, PAGE_W, PAGE_W], fill=TICKER_BG)
label = "THE WIRE"
pen.text((MARGIN, TICKER_TOP + 9), label, font=f_tick, fill=TICKER_LABEL)
label_w = pen.textlength(label, font=f_tick) + 12
items_text = "  ▪  ".join(TICKER_ITEMS)

def fill_lines(text, first_width, width, max_lines):
    lines = []
    limit = first_width
    current = ""
    for word in text.split():
        trial = word if not current else current + " " + word
        if pen.textlength(trial, font=f_tick) <= limit:
            current = trial
        else:
            lines.append(current)
            current = word
            limit = width
            if len(lines) >= max_lines:
                return lines
    if current and len(lines) < max_lines:
        lines.append(current)
    return lines

tick_lines = fill_lines(items_text, CONTENT_W - label_w, CONTENT_W, 3)
ty = TICKER_TOP + 9
for i, line in enumerate(tick_lines):
    x = MARGIN + label_w if i == 0 else MARGIN
    pen.text((x, ty), line, font=f_tick, fill=WHITE)
    ty += 17

img.save(OUT_PATH, format="PNG")
`;

function renderPoster(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(outDir, { recursive: true });
  const workDir = mkdtempSync(join(tmpdir(), 'world-gazette-'));
  const scriptPath = join(workDir, 'make_poster.py');
  writeFileSync(scriptPath, MAKE_POSTER_PY);
  execFileSync('python3', [scriptPath, join(outDir, 'entry.png')], { stdio: 'inherit' });
}

renderPoster();
