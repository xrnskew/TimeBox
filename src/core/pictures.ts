// Рисунки игр TimeBox — векторные, в едином стиле: толстый тёмный контур, мягкий объём (свет сверху слева),
// блик и живые глаза. Каждый рисунок — SVG 64×64; в игре он занимает 34×34, как прежний смайлик, поэтому
// все рамки столкновений прежние. Вектор чёткий при любом размере: в игре, в окне выбора, в меню.
// Имя рисунка — по-русски, его пишет ученик: drawPic("ракета", x, y). Чистый модуль: без DOM.

/** Группы в окне выбора — в таком порядке. */
export const PICTURE_GROUPS: { title: string; names: string[] }[] = [
  { title: 'Герои', names: ['колобок', 'кот', 'лиса', 'лягушка', 'робот', 'пингвин', 'корзинка'] },
  { title: 'Еда', names: ['яблоко', 'груша', 'вишня', 'клубника', 'пончик', 'рыба'] },
  { title: 'Вещи', names: ['бомба', 'звезда', 'монетка', 'сердце', 'молния'] },
  { title: 'Летают', names: ['цыплёнок', 'птичка', 'сова', 'пчела', 'мышь', 'дракон'] },
  { title: 'Космос', names: ['ракета', 'тарелка', 'пришелец', 'осьминог', 'астероид', 'взрыв', 'луна'] },
]

/** Все имена рисунков, которые можно выбрать. */
export const PICTURE_NAMES = PICTURE_GROUPS.flatMap((g) => g.names)

/** Его игра рисует вместо картинки с неизвестным именем — например, с опечаткой. */
export const UNKNOWN_PICTURE = '?'

// ===== Общие детали стиля =====

/** Чернила: контур, зрачки, рот. */
const INK = '#1b1424'
/** Контур силуэта. */
const line = (w = 3.5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`
/** Тонкий контур мелких деталей. */
const thin = (w = 2.4) => line(w)

/** Объём: светлее сверху слева, темнее снизу справа. */
const shade = (id: string, light: string, base: string, dark: string) =>
  `<radialGradient id="${id}" cx="34%" cy="28%" r="78%"><stop offset="0" stop-color="${light}"/><stop offset=".55" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/></radialGradient>`

/** Блик — мягкое белое пятно. */
const shine = (cx: number, cy: number, rx: number, ry: number, angle = -30) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".55" transform="rotate(${angle} ${cx} ${cy})"/>`

/** Глаз-точка с бликом. */
const dot = (cx: number, cy: number, r = 3.2) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 1.25}" fill="${INK}"/><circle cx="${cx + r * 0.38}" cy="${cy - r * 0.5}" r="${r * 0.38}" fill="#fff"/>`

/** Большой глаз: белок, зрачок, блик. */
const eye = (cx: number, cy: number, r: number, look = 0.25) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" ${thin()}/><circle cx="${cx + r * look}" cy="${cy + r * 0.1}" r="${r * 0.52}" fill="${INK}"/><circle cx="${cx + r * look + r * 0.2}" cy="${cy - r * 0.15}" r="${r * 0.2}" fill="#fff"/>`

/** Румянец. */
const blush = (cx: number, cy: number) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="4.4" ry="2.8" fill="#ff6f9f" opacity=".6"/>`

/** Звезда с `n` лучами: внешний радиус R, внутренний r. */
function star(cx: number, cy: number, R: number, r: number, n = 5, turn = -90): string {
  const pts: string[] = []
  for (let k = 0; k < n * 2; k++) {
    const a = ((turn + (k * 180) / n) * Math.PI) / 180
    const d = k % 2 ? r : R
    pts.push(`${(cx + d * Math.cos(a)).toFixed(1)} ${(cy + d * Math.sin(a)).toFixed(1)}`)
  }
  return `M${pts.join(' L')}Z`
}

/** Полумесяц: круг (cx, cy, r) без круга (ox, oy, or) — путь из двух дуг через точки, где круги пересекаются. */
function crescent(cx: number, cy: number, r: number, ox: number, oy: number, or: number): string {
  const d = Math.hypot(ox - cx, oy - cy)
  const a = (r * r - or * or + d * d) / (2 * d)
  const h = Math.sqrt(r * r - a * a)
  const [ux, uy] = [(ox - cx) / d, (oy - cy) / d]
  const [px, py] = [cx + a * ux, cy + a * uy]
  const p1 = `${(px + h * uy).toFixed(1)} ${(py - h * ux).toFixed(1)}`
  const p2 = `${(px - h * uy).toFixed(1)} ${(py + h * ux).toFixed(1)}`
  return `M${p1} A${r} ${r} 0 1 0 ${p2} A${or} ${or} 0 0 1 ${p1}Z`
}

const svg = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${body}</svg>`

// ===== Рисунки =====

const ART: Record<string, string> = {
  колобок: svg(`<defs>${shade('a', '#fff1a6', '#ffcf3d', '#e08a12')}</defs>
<circle cx="32" cy="34" r="26" fill="url(#a)" ${line()}/>
${shine(21, 20, 7, 4)}
${dot(24, 31)}${dot(40, 31)}
${blush(17, 40)}${blush(47, 40)}
<path d="M24 41 Q32 49 40 41" fill="none" ${thin(3)}/>`),

  кот: svg(`<defs>${shade('a', '#ffc27a', '#f88d2c', '#c9561a')}</defs>
<path d="M9 34 L11 5 L30 18 Z M55 34 L53 5 L34 18 Z" fill="url(#a)" ${line()}/>
<path d="M14 24 L15 12 L24 19 Z M50 24 L49 12 L40 19 Z" fill="#ff8fb3"/>
<ellipse cx="32" cy="37" rx="26" ry="21" fill="url(#a)" ${line()}/>
<path d="M32 17 v7 M25 18.5 l1.5 6 M39 18.5 l-1.5 6" stroke="#c4561b" stroke-width="2.6" stroke-linecap="round"/>
${shine(18, 28, 5, 3)}
<ellipse cx="32" cy="46" rx="10" ry="6.5" fill="#fff4e6"/>
<ellipse cx="22.5" cy="35" rx="4.6" ry="5.4" fill="#a8e06a" ${thin()}/><ellipse cx="22.5" cy="35.5" rx="1.7" ry="4.2" fill="${INK}"/>
<ellipse cx="41.5" cy="35" rx="4.6" ry="5.4" fill="#a8e06a" ${thin()}/><ellipse cx="41.5" cy="35.5" rx="1.7" ry="4.2" fill="${INK}"/>
<circle cx="24" cy="33" r="1.2" fill="#fff"/><circle cx="43" cy="33" r="1.2" fill="#fff"/>
<path d="M29.4 42 h5.2 L32 45 Z" fill="#ff6f9f" ${thin(1.6)}/>
<path d="M32 45 q-2.5 3.5 -5.5 1.2 M32 45 q2.5 3.5 5.5 1.2" fill="none" ${thin(2)}/>
<path d="M14 42 h-9 M14.5 46 l-8 3 M50 42 h9 M49.5 46 l8 3" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`),

  лиса: svg(`<defs>${shade('a', '#ffb45e', '#f2741f', '#b84a12')}</defs>
<path d="M6 6 L27 19 L12 33 Z M58 6 L37 19 L52 33 Z" fill="url(#a)" ${line()}/>
<path d="M10 11 L20 18 L13 25 Z M54 11 L44 18 L51 25 Z" fill="#5e3720"/>
<path d="M5 27 Q32 10 59 27 Q57 45 32 59 Q7 45 5 27 Z" fill="url(#a)" ${line()}/>
<path d="M7 31 Q21 37 32 59 Q12 49 7 31 Z M57 31 Q43 37 32 59 Q52 49 57 31 Z" fill="#fff4e6"/>
${shine(19, 22, 6, 3, -20)}
${dot(22, 33)}${dot(42, 33)}
<ellipse cx="32" cy="53" rx="4.4" ry="3.2" fill="${INK}"/><circle cx="33.4" cy="52" r="1.1" fill="#fff"/>`),

  лягушка: svg(`<defs>${shade('a', '#b9f27c', '#4cbf4a', '#23803a')}</defs>
<g ${line(7)}><circle cx="18" cy="19" r="11"/><circle cx="46" cy="19" r="11"/><ellipse cx="32" cy="41" rx="28" ry="19"/></g>
<g fill="url(#a)"><circle cx="18" cy="19" r="11"/><circle cx="46" cy="19" r="11"/><ellipse cx="32" cy="41" rx="28" ry="19"/></g>
<ellipse cx="32" cy="48" rx="17" ry="9" fill="#dcf7b0"/>
${shine(12, 31, 5, 3, -40)}
${eye(18, 19, 6.5, 0.15)}${eye(46, 19, 6.5, -0.15)}
${blush(14, 40)}${blush(50, 40)}
<path d="M17 37 Q32 47 47 37" fill="none" ${thin(3)}/>`),

  робот: svg(`<defs>${shade('a', '#f2f4fa', '#c3c8d9', '#7d849e')}</defs>
<rect x="3" y="28" width="7" height="13" rx="3" fill="#8a91aa" ${line()}/><rect x="54" y="28" width="7" height="13" rx="3" fill="#8a91aa" ${line()}/>
<path d="M32 15 V8" ${line()}/><circle cx="32" cy="7" r="4.5" fill="#ff5b4f" ${line(3)}/>
<rect x="8" y="15" width="48" height="43" rx="11" fill="url(#a)" ${line()}/>
${shine(17, 22, 5, 2.6)}
<rect x="14" y="23" width="36" height="20" rx="7" fill="#1f2a44" ${thin()}/>
<circle cx="24" cy="33" r="5" fill="#5ccdf2"/><circle cx="40" cy="33" r="5" fill="#5ccdf2"/>
<circle cx="25.6" cy="31.3" r="1.6" fill="#fff"/><circle cx="41.6" cy="31.3" r="1.6" fill="#fff"/>
<rect x="21" y="47" width="22" height="6" rx="3" fill="#565c75"/>
<path d="M26.5 47 v6 M32 47 v6 M37.5 47 v6" stroke="#c3c8d9" stroke-width="1.6"/>`),

  пингвин: svg(`<defs>${shade('a', '#5a6ad6', '#2b3577', '#151b45')}</defs>
<ellipse cx="22" cy="58" rx="7.5" ry="3.8" fill="#ff9a2e" ${thin()}/><ellipse cx="42" cy="58" rx="7.5" ry="3.8" fill="#ff9a2e" ${thin()}/>
<path d="M9 30 Q1 42 8 50 Q12 44 13 38 Z M55 30 Q63 42 56 50 Q52 44 51 38 Z" fill="#232b66" ${line()}/>
<path d="M32 4 C50 4 55 22 55 38 C55 52 46 59 32 59 C18 59 9 52 9 38 C9 22 14 4 32 4 Z" fill="url(#a)" ${line()}/>
<path d="M32 17 C44 17 47 29 47 40 C47 51 40 55 32 55 C24 55 17 51 17 40 C17 29 20 17 32 17 Z" fill="#fff4e6"/>
${shine(20, 13, 5, 2.6)}
${eye(24.5, 22, 5, 0.2)}${eye(39.5, 22, 5, -0.2)}
<path d="M26 29.5 H38 L32 37 Z" fill="#ffb12e" ${thin()}/>
${blush(20, 34)}${blush(44, 34)}`),

  корзинка:
    svg(`<defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3a564"/><stop offset="1" stop-color="#9a5a2b"/></linearGradient></defs>
<path d="M14 31 C14 6 50 6 50 31" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
<path d="M14 31 C14 6 50 6 50 31" fill="none" stroke="#c98a4b" stroke-width="3.6" stroke-linecap="round"/>
<path d="M6 31 H58 L51 58 H13 Z" fill="url(#a)" ${line()}/>
<path d="M10 42 H54 M12 50 H52" stroke="#7a4421" stroke-width="2.2"/>
<path d="M21 34 L23 57 M32 34 V57 M43 34 L41 57" stroke="#7a4421" stroke-width="2.2"/>
<rect x="3" y="25" width="58" height="10" rx="5" fill="#b5713a" ${line()}/>
<path d="M9 28 H30" stroke="#f0c48d" stroke-width="2.4" stroke-linecap="round"/>`),

  яблоко: svg(`<defs>${shade('a', '#ff8a7a', '#e8323a', '#9e1730')}</defs>
<path d="M32 19 C24 11 6 12 7 32 C8 50 20 61 32 56 C44 61 56 50 57 32 C58 12 40 11 32 19 Z" fill="url(#a)" ${line()}/>
<path d="M32 19 C32 13 34 8 37 5" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/>
<path d="M32 19 C32 13 34 8 37 5" fill="none" stroke="#8a4f22" stroke-width="2.4" stroke-linecap="round"/>
<path d="M37 13 C42 4 52 5 55 9 C49 15 42 16 37 13 Z" fill="#45b54a" ${thin()}/>
<path d="M39.5 12.5 C44 9.5 48 9 52 9.5" fill="none" stroke="#2c8a3c" stroke-width="1.4" stroke-linecap="round"/>
${shine(18, 30, 4.6, 8, 18)}`),

  груша: svg(`<defs>${shade('a', '#e8ff9e', '#a7d943', '#5f9a26')}</defs>
<path d="M32 11 C39 11 40 19 42 24 C52 30 56 40 54 48 C52 58 42 60 32 60 C22 60 12 58 10 48 C8 40 12 30 22 24 C24 19 25 11 32 11 Z" fill="url(#a)" ${line()}/>
<path d="M32 12 C32 8 33 5 35 3" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
<path d="M32 12 C32 8 33 5 35 3" fill="none" stroke="#8a4f22" stroke-width="2.2" stroke-linecap="round"/>
<path d="M35 8 C39 2 47 2 50 5 C45 10 39 11 35 8 Z" fill="#45b54a" ${thin()}/>
${shine(20, 40, 4, 7, 15)}
<circle cx="40" cy="44" r="1.2" fill="#6e9a2c"/><circle cx="27" cy="51" r="1.2" fill="#6e9a2c"/><circle cx="36" cy="33" r="1.1" fill="#6e9a2c"/>`),

  вишня: svg(`<defs>${shade('a', '#ff8b8b', '#d82645', '#8e112c')}</defs>
<path d="M19 42 C21 27 30 14 42 7 M45 44 C45 30 45 18 42 7" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/>
<path d="M19 42 C21 27 30 14 42 7 M45 44 C45 30 45 18 42 7" fill="none" stroke="#3f8f3a" stroke-width="2.4" stroke-linecap="round"/>
<path d="M42 7 C48 1 58 3 61 7 C55 12 48 12 42 7 Z" fill="#45b54a" ${thin()}/>
<circle cx="19" cy="46" r="13" fill="url(#a)" ${line()}/><circle cx="45" cy="48" r="12" fill="url(#a)" ${line()}/>
${shine(14, 41, 3, 4.6, 25)}${shine(40, 43, 2.8, 4.2, 25)}`),

  клубника: svg(`<defs>${shade('a', '#ff8a8a', '#ec2f45', '#a3162f')}</defs>
<path d="M10 23 C10 15 20 13 32 15 C44 13 54 15 54 23 C54 41 42 58 32 60 C22 58 10 41 10 23 Z" fill="url(#a)" ${line()}/>
<g fill="#ffe58a"><ellipse cx="21" cy="28" rx="1.4" ry="2"/><ellipse cx="32" cy="27" rx="1.4" ry="2"/><ellipse cx="43" cy="28" rx="1.4" ry="2"/><ellipse cx="26" cy="37" rx="1.4" ry="2"/><ellipse cx="38" cy="37" rx="1.4" ry="2"/><ellipse cx="20" cy="40" rx="1.4" ry="2"/><ellipse cx="44" cy="40" rx="1.4" ry="2"/><ellipse cx="32" cy="46" rx="1.4" ry="2"/><ellipse cx="27" cy="52" rx="1.3" ry="1.8"/><ellipse cx="37" cy="52" rx="1.3" ry="1.8"/></g>
<path d="M13 16 L23 18 L20 7 L29 14 L32 3 L35 14 L44 7 L41 18 L51 16 L44 23 L20 23 Z" fill="#45b54a" ${thin()}/>
${shine(16, 30, 3, 6, 15)}`),

  пончик: svg(`<defs>${shade('a', '#ffe0a8', '#e9b06a', '#b9783a')}${shade('b', '#ffc2dc', '#ff7fb2', '#d84b87')}
<mask id="h"><rect width="64" height="64" fill="#fff"/><circle cx="32" cy="32" r="8" fill="#000"/></mask></defs>
<g mask="url(#h)">
<circle cx="32" cy="34" r="26" fill="url(#a)" ${line()}/>
<path d="M9 30 C9 16 21 8 32 8 C44 8 55 16 55 30 C53 35 49 32 47 37 C43 41 39 35 35 39 C31 43 27 37 23 41 C19 43 17 37 13 37 C10 35 9 33 9 30 Z" fill="url(#b)"/>
${shine(19, 17, 6, 3)}
<g stroke-width="2.6" stroke-linecap="round"><path d="M22 15 l3 2" stroke="#5ccdf2"/><path d="M41 14 l-3 2" stroke="#ffe066"/><path d="M47 24 l1 3" stroke="#9be05a"/><path d="M16 27 l1-3" stroke="#fff"/><path d="M30 13 l3 0" stroke="#9be05a"/><path d="M40 28 l3 1" stroke="#5ccdf2"/><path d="M21 30 l2 2" stroke="#ffe066"/></g>
</g>
<circle cx="32" cy="32" r="8" fill="none" ${thin(3)}/>`),

  рыба: svg(`<defs>${shade('a', '#a6ecff', '#3fb8ea', '#1d6fc0')}</defs>
<path d="M44 32 L61 17 L58 32 L61 47 Z" fill="#2f8fd8" ${line()}/>
<path d="M18 19 C24 8 36 9 39 19 Z" fill="#2f8fd8" ${line()}/>
<ellipse cx="28" cy="33" rx="23" ry="16" fill="url(#a)" ${line()}/>
<path d="M31 20 C27 28 27 38 31 46 M39 21 C35 29 35 37 39 45" fill="none" stroke="#2585cf" stroke-width="2.4" stroke-linecap="round"/>
${shine(20, 24, 6, 2.6, -15)}
${eye(15, 30, 5, -0.2)}
<path d="M6 37 Q9 39 12 37" fill="none" ${thin()}/>`),

  бомба: svg(`<defs>${shade('a', '#8d93ab', '#3d4155', '#1c1e2a')}</defs>
<path d="M43 14 C46 9 51 11 54 8" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
<path d="M43 14 C46 9 51 11 54 8" fill="none" stroke="#d9b77a" stroke-width="2.2" stroke-linecap="round"/>
<rect x="33" y="12" width="13" height="10" rx="2.5" fill="#6b7290" ${line()} transform="rotate(38 39.5 17)"/>
<circle cx="28" cy="39" r="22" fill="url(#a)" ${line()}/>
${shine(19, 28, 6, 3.4)}
<path d="${star(55, 8, 7, 3, 6, -90)}" fill="#ffd23f" stroke="#ff8a1f" stroke-width="1.6" stroke-linejoin="round"/>
<circle cx="55" cy="8" r="2" fill="#fff"/>`),

  звезда: svg(`<defs>${shade('a', '#fff3a3', '#ffcd2e', '#e0901a')}</defs>
<path d="${star(32, 35, 29, 13)}" fill="url(#a)" ${line(3.8)}/>
${shine(25, 25, 4, 2.2, -40)}
${dot(27, 35, 2.6)}${dot(37, 35, 2.6)}
<path d="M29 42 Q32 45 35 42" fill="none" ${thin(2.2)}/>`),

  монетка: svg(`<defs>${shade('a', '#fff1a1', '#ffc933', '#d4871a')}</defs>
<circle cx="32" cy="33" r="26" fill="url(#a)" ${line()}/>
<circle cx="32" cy="33" r="19" fill="none" stroke="#c97c14" stroke-width="2.6"/>
<path d="${star(32, 34, 11, 5)}" fill="#e89a1c" stroke="#b56d10" stroke-width="1.6" stroke-linejoin="round"/>
${shine(20, 20, 6, 3)}`),

  сердце: svg(`<defs>${shade('a', '#ff8fa6', '#ef3b5a', '#a51536')}</defs>
<path d="M32 57 C26 51 5 40 5 23 C5 13 13 7 21 7 C27 7 30 11 32 15 C34 11 37 7 43 7 C51 7 59 13 59 23 C59 40 38 51 32 57 Z" fill="url(#a)" ${line()}/>
${shine(17, 19, 5, 3.4, -35)}`),

  молния:
    svg(`<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4a3"/><stop offset=".5" stop-color="#ffd02e"/><stop offset="1" stop-color="#f08a12"/></linearGradient></defs>
<path d="M38 3 L12 36 H29 L22 61 L52 25 H35 L44 3 Z" fill="url(#a)" ${line()}/>
<path d="M37 12 L25 28" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>`),

  цыплёнок:
    svg(`<defs>${shade('a', '#fff6a6', '#ffd433', '#e3961a')}${shade('b', '#ffe27a', '#ffbe2a', '#e08a12')}</defs>
<ellipse cx="22" cy="59" rx="5" ry="2.8" fill="#ff9a2e" ${thin()}/><ellipse cx="38" cy="59" rx="5" ry="2.8" fill="#ff9a2e" ${thin()}/>
<ellipse cx="30" cy="35" rx="25" ry="23" fill="url(#a)" ${line()}/>
<path d="M27 14 C23 6 29 4 31 10 C31 3 38 4 35 11 C39 8 43 11 37 15" fill="#ffd433" ${thin()}/>
<path d="M51 31 L61 35 L51 40 Z" fill="#ff9a2e" ${thin()}/>
<path d="M30 38 C27 28 15 25 6 30 C8 41 20 47 30 38 Z" fill="url(#b)" ${thin()}/>
<path d="M11 32 C16 34 20 36 23 39 M10 36 C14 38 17 40 20 41" fill="none" stroke="#e08a12" stroke-width="1.6" stroke-linecap="round"/>
${shine(22, 20, 6, 3.2)}
${dot(41, 28, 3.2)}
${blush(43, 38)}`),

  птичка: svg(`<defs>${shade('a', '#8fb8ff', '#3a66e0', '#1f3a9a')}${shade('b', '#b9d2ff', '#6f94f2', '#3a5fc9')}</defs>
<path d="M12 31 L4 24 L6 33 L3 41 L12 39 Z" fill="#2f55c4" ${line()}/>
<ellipse cx="22" cy="58" rx="4.5" ry="2.6" fill="#ffb12e" ${thin()}/><ellipse cx="34" cy="58" rx="4.5" ry="2.6" fill="#ffb12e" ${thin()}/>
<ellipse cx="30" cy="35" rx="23" ry="21" fill="url(#a)" ${line()}/>
<ellipse cx="33" cy="45" rx="13" ry="8.5" fill="#e9f1ff"/>
<path d="M50 30 L61 34 L50 39 Z" fill="#ffb12e" ${thin()}/>
<path d="M30 37 C27 27 15 23 7 28 C9 39 20 45 30 37 Z" fill="url(#b)" ${thin()}/>
<path d="M12 31 C17 33 21 36 24 38 M11 35 C15 37 18 39 21 40" fill="none" stroke="#3a5fc9" stroke-width="1.6" stroke-linecap="round"/>
${shine(22, 19, 5, 2.6)}
${eye(41, 26, 5.2, 0.3)}`),

  сова: svg(`<defs>${shade('a', '#d9a06a', '#a0602f', '#653a1b')}</defs>
<path d="M10 22 L9 4 L22 13 Z M54 22 L55 4 L42 13 Z" fill="url(#a)" ${line()}/>
<path d="M32 9 C52 9 57 24 57 38 C57 53 46 60 32 60 C18 60 7 53 7 38 C7 24 12 9 32 9 Z" fill="url(#a)" ${line()}/>
<path d="M32 33 C42 33 46 42 46 48 C46 55 40 58 32 58 C24 58 18 55 18 48 C18 42 22 33 32 33 Z" fill="#f2d2a6"/>
<path d="M25 44 q2 2 4 0 M35 44 q2 2 4 0 M30 51 q2 2 4 0" fill="none" stroke="#c48a55" stroke-width="1.8" stroke-linecap="round"/>
<circle cx="21" cy="26" r="10" fill="#f2d2a6"/><circle cx="43" cy="26" r="10" fill="#f2d2a6"/>
${eye(21, 26, 7, 0.15)}${eye(43, 26, 7, -0.15)}
<path d="M28.5 33 H35.5 L32 39 Z" fill="#ffb12e" ${thin()}/>`),

  пчела: svg(`<defs>${shade('a', '#fff3a0', '#ffcf2e', '#e0901a')}</defs>
<ellipse cx="22" cy="14" rx="9" ry="12" fill="#dff4ff" ${line(3)} opacity=".95" transform="rotate(-25 22 14)"/>
<ellipse cx="37" cy="13" rx="9" ry="12" fill="#dff4ff" ${line(3)} opacity=".95" transform="rotate(20 37 13)"/>
<path d="M5 36 L12 34 L11 39 Z" fill="${INK}"/>
<ellipse cx="32" cy="38" rx="25" ry="19" fill="url(#a)" ${line()}/>
<path d="M22 21 C19 30 19 46 22 55 L29 56 C26 46 26 30 29 19 Z M37 19 C34 30 34 46 37 56 L44 54 C41 45 41 30 44 22 Z" fill="${INK}"/>
${shine(16, 30, 4, 2.4, -50)}
${eye(49, 34, 4.8, 0.25)}
${blush(50, 44)}
<path d="M52 21 C54 14 58 13 60 15" fill="none" ${thin()}/>`),

  мышь: svg(`<defs>${shade('a', '#c49cff', '#8256d6', '#4f2c95')}</defs>
<path d="M30 30 C22 16 12 16 2 22 C6 26 6 32 4 38 C10 34 16 36 18 42 C20 37 26 36 30 40 Z" fill="#5c3591" ${line()}/>
<path d="M34 30 C42 16 52 16 62 22 C58 26 58 32 60 38 C54 34 48 36 46 42 C44 37 38 36 34 40 Z" fill="#5c3591" ${line()}/>
<path d="M22 22 L20 9 L28 16 Z M42 22 L44 9 L36 16 Z" fill="url(#a)" ${line()}/>
<ellipse cx="32" cy="32" rx="14" ry="16" fill="url(#a)" ${line()}/>
${shine(26, 22, 3.6, 2, -30)}
<ellipse cx="26.5" cy="30" rx="3.4" ry="4" fill="#ffe066"/><ellipse cx="37.5" cy="30" rx="3.4" ry="4" fill="#ffe066"/>
<ellipse cx="27" cy="30.5" rx="1.4" ry="2.4" fill="${INK}"/><ellipse cx="38" cy="30.5" rx="1.4" ry="2.4" fill="${INK}"/>
<path d="M27 38 Q32 42 37 38" fill="none" ${thin(2)}/>
<path d="M29 39.5 l1 3 l1-2.5 M35 39.5 l-1 3 l-1-2.5" fill="#fff" stroke="#fff" stroke-width="1"/>`),

  дракон: svg(`<defs>${shade('a', '#9ff08a', '#3fb553', '#1f7a3c')}</defs>
<path d="M17 18 L11 3 L25 13 Z M47 18 L53 3 L39 13 Z" fill="#fff4e6" ${line()}/>
<path d="M4 30 L12 22 L14 34 Z M60 30 L52 22 L50 34 Z" fill="#2f9e4a" ${line()}/>
<ellipse cx="32" cy="33" rx="22" ry="20" fill="url(#a)" ${line()}/>
<path d="M26 12 L29 6 L32 12 L35 6 L38 12" fill="#ff8a2e" ${thin()}/>
<ellipse cx="32" cy="46" rx="15" ry="10" fill="#c9f59a" ${thin()}/>
<circle cx="27" cy="45" r="1.6" fill="${INK}"/><circle cx="37" cy="45" r="1.6" fill="${INK}"/>
${shine(19, 22, 5, 2.8)}
${eye(23, 31, 5.4, 0.2)}${eye(41, 31, 5.4, -0.2)}
<path d="M24 51 Q32 56 40 51" fill="none" ${thin(2.2)}/>`),

  ракета:
    svg(`<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#e3e7f2"/><stop offset="1" stop-color="#a9b0c8"/></linearGradient>${shade('b', '#ff9a8a', '#ec3b3b', '#a3182c')}</defs>
<path d="M26 50 Q32 66 38 50 Z" fill="#ffd23f" ${thin()}/><path d="M29 51 Q32 59 35 51 Z" fill="#fff4b0"/>
<path d="M21 34 L8 48 L10 56 L23 49 Z M43 34 L56 48 L54 56 L41 49 Z" fill="url(#b)" ${line()}/>
<path d="M32 3 C44 13 46 30 43 50 H21 C18 30 20 13 32 3 Z" fill="url(#a)" ${line()}/>
<path d="M32 3 C38 8 41.5 13 42.5 19 H21.5 C22.5 13 26 8 32 3 Z" fill="url(#b)" ${line()}/>
<circle cx="32" cy="30" r="6.5" fill="#5ccdf2" ${line(3)}/><circle cx="30" cy="28" r="2" fill="#fff"/>
<path d="M29 43 V50 M35 43 V50" stroke="#a9b0c8" stroke-width="2"/>`),

  тарелка:
    svg(`<defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef1f8"/><stop offset=".5" stop-color="#b9bfd3"/><stop offset="1" stop-color="#6b7290"/></linearGradient>${shade('b', '#e9fbff', '#8fe0f5', '#3fa9d6')}</defs>
<path d="M20 50 L14 60 M44 50 L50 60" ${line()}/>
<path d="M16 32 C16 7 48 7 48 32 Z" fill="url(#b)" ${line()}/>
<circle cx="32" cy="22" r="6" fill="#9be05a" ${thin()}/>${dot(30, 22, 1.6)}${dot(35, 22, 1.6)}
${shine(24, 16, 4, 2.2)}
<ellipse cx="32" cy="36" rx="29" ry="12" fill="url(#a)" ${line()}/>
<ellipse cx="32" cy="33" rx="18" ry="4" fill="#dfe3ee"/>
<circle cx="15" cy="40" r="2.6" fill="#ffd23f" ${thin(1.6)}/><circle cx="32" cy="43" r="2.6" fill="#ff5b4f" ${thin(1.6)}/><circle cx="49" cy="40" r="2.6" fill="#9be05a" ${thin(1.6)}/>`),

  пришелец: svg(`<defs>${shade('a', '#d6b5ff', '#9258e6', '#5a2fa3')}</defs>
<path d="M18 16 L12 5 M46 16 L52 5" ${line()}/><circle cx="12" cy="5" r="3.6" fill="#9be05a" ${thin()}/><circle cx="52" cy="5" r="3.6" fill="#9be05a" ${thin()}/>
<path d="M8 32 C8 18 18 12 32 12 C46 12 56 18 56 32 L56 44 L49 40 L44 50 L38 42 L32 52 L26 42 L20 50 L15 40 L8 44 Z" fill="url(#a)" ${line()}/>
${shine(18, 20, 5, 2.6)}
<ellipse cx="23" cy="30" rx="6" ry="7" fill="#e9ff9a" ${thin()}/><ellipse cx="41" cy="30" rx="6" ry="7" fill="#e9ff9a" ${thin()}/>
<ellipse cx="24" cy="31" rx="2.6" ry="3.6" fill="${INK}"/><ellipse cx="40" cy="31" rx="2.6" ry="3.6" fill="${INK}"/>
<circle cx="25" cy="29" r="1.1" fill="#fff"/><circle cx="41" cy="29" r="1.1" fill="#fff"/>`),

  осьминог: svg(`<defs>${shade('a', '#ffc2db', '#ff6fa8', '#c93a78')}</defs>
<g fill="none" stroke-linecap="round"><path d="M16 38 C9 46 7 53 12 58 M25 42 C23 50 21 55 25 60 M39 42 C41 50 43 55 39 60 M48 38 C55 46 57 53 52 58" stroke="${INK}" stroke-width="10.5"/>
<path d="M16 38 C9 46 7 53 12 58 M25 42 C23 50 21 55 25 60 M39 42 C41 50 43 55 39 60 M48 38 C55 46 57 53 52 58" stroke="#f05c98" stroke-width="5"/></g>
<path d="M32 4 C48 4 56 16 56 28 C56 40 46 46 32 46 C18 46 8 40 8 28 C8 16 16 4 32 4 Z" fill="url(#a)" ${line()}/>
${shine(20, 14, 6, 3.4)}
${eye(24, 27, 5.4, 0.15)}${eye(40, 27, 5.4, -0.15)}
${blush(17, 36)}${blush(47, 36)}
<path d="M28 37 Q32 41 36 37" fill="none" ${thin(2.2)}/>
<circle cx="44" cy="12" r="2" fill="#ffd6e8"/><circle cx="49" cy="18" r="1.4" fill="#ffd6e8"/>`),

  астероид: svg(`<defs>${shade('a', '#c9bfb0', '#8c7f70', '#544a40')}</defs>
<path d="M18 8 L38 5 L54 15 L60 33 L53 52 L35 60 L15 55 L5 40 L6 20 Z" fill="url(#a)" ${line()}/>
<ellipse cx="38" cy="22" rx="7" ry="5.5" fill="#6e6357" ${thin(2)}/><ellipse cx="39" cy="23" rx="4.5" ry="3" fill="#5b5148"/>
<ellipse cx="22" cy="40" rx="8" ry="6.5" fill="#6e6357" ${thin(2)}/><ellipse cx="23" cy="41" rx="5" ry="3.8" fill="#5b5148"/>
<circle cx="45" cy="44" r="3.6" fill="#6e6357" ${thin(1.8)}/>
${shine(17, 18, 5, 2.6)}`),

  взрыв: svg(`<path d="${star(32, 32, 30, 17, 12, -90)}" fill="#ff5b2e" ${line()}/>
<path d="${star(32, 32, 21, 12, 10, -72)}" fill="#ffa02e"/>
<path d="${star(32, 32, 13, 8, 8, -90)}" fill="#ffe066"/>
<circle cx="32" cy="32" r="5.5" fill="#fffbe0"/>`),

  луна: svg(`<defs>${shade('a', '#fff6c4', '#ffd95a', '#d9a32a')}</defs>
<path d="${crescent(28, 33, 26, 43, 22, 20)}" fill="url(#a)" ${line()}/>
<circle cx="17" cy="23" r="3.2" fill="#ebbd42"/><circle cx="12" cy="42" r="2.4" fill="#ebbd42"/><circle cx="31" cy="54" r="2.6" fill="#ebbd42"/>
${shine(16, 15, 4, 2.2, -50)}
<path d="M18 33 Q21 30 24 33" fill="none" ${thin(2.2)}/>
${blush(18, 40)}
<path d="M23 45 Q27 48 31 45" fill="none" ${thin(2.2)}/>`),

  '?': svg(`<rect x="6" y="6" width="52" height="52" rx="12" fill="#8a91aa" ${line()}/>
<path d="M23 25 C23 15 41 14 41 24 C41 31 32 31 32 39" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="32" cy="49" r="3.6" fill="#fff"/>`),
}

export const isPicture = (name: string) => name !== UNKNOWN_PICTURE && Object.hasOwn(ART, name)

/** SVG-разметка рисунка (64×64). Неизвестное имя — рисунок «?». */
export const pictureSvg = (name: string): string => ART[Object.hasOwn(ART, name) ? name : UNKNOWN_PICTURE]

/** Рисунок как адрес картинки — для <img>, CSS и new Image(). */
export const pictureUrl = (name: string): string => `data:image/svg+xml,${encodeURIComponent(pictureSvg(name))}`
