export function catMarkup(): string {
  return `
    <div id="stage">
      <div id="hud" class="hud" hidden>
        <div class="hud-title">橘子的状态</div>
        <div class="hud-row">
          <span>心情</span>
          <div class="bar mood"><i id="mood-bar"></i></div>
          <em id="mood-val">80</em>
        </div>
        <div class="hud-row">
          <span>饱食</span>
          <div class="bar hunger"><i id="hunger-bar"></i></div>
          <em id="hunger-val">80</em>
        </div>
        <div id="hud-hint" class="hud-hint">右键打开菜单</div>
      </div>

      <div class="fx">
        <div class="zzz" aria-hidden="true">Zzz</div>
        <div class="hearts" aria-hidden="true">
          <span>♥</span><span>♥</span><span>♥</span>
        </div>
        <div class="thought" aria-hidden="true">
          <svg viewBox="0 0 36 24" width="28" height="18">
            <ellipse cx="18" cy="12" rx="16" ry="10" fill="#fff8ee" stroke="#e8b070" stroke-width="1.2"/>
            <path d="M8 13 L28 11 L26 15 L12 16 Z" fill="#6ec1ff"/>
            <circle cx="26" cy="13" r="2.2" fill="#ffd36a"/>
          </svg>
        </div>
      </div>

      <div id="pet" class="pet state-idle facing-right" data-state="idle">
        <div class="yarn" aria-hidden="true"></div>
        <div class="fish" aria-hidden="true">
          <svg viewBox="0 0 40 24" width="36" height="22">
            <path d="M4 12 L14 6 C28 2 32 8 36 12 C32 16 28 22 14 18 Z" fill="#6ec1ff" stroke="#3a8ec9" stroke-width="1.2"/>
            <path d="M4 12 L12 8 L12 16 Z" fill="#4aa3e0"/>
            <circle cx="28" cy="11" r="1.6" fill="#1d3557"/>
            <path d="M18 8 Q20 12 18 16" fill="none" stroke="#3a8ec9" stroke-width="1"/>
          </svg>
        </div>

        <svg class="cat-svg" viewBox="0 0 168 168" width="168" height="168" role="img" aria-label="橘猫">
          <defs>
            <radialGradient id="fur" cx="40%" cy="35%" r="75%">
              <stop offset="0%" stop-color="#F6C26A"/>
              <stop offset="55%" stop-color="#EE9A3A"/>
              <stop offset="100%" stop-color="#D97A22"/>
            </radialGradient>
            <radialGradient id="fur-head" cx="45%" cy="30%" r="70%">
              <stop offset="0%" stop-color="#F8C97A"/>
              <stop offset="70%" stop-color="#F0A045"/>
              <stop offset="100%" stop-color="#DC8128"/>
            </radialGradient>
            <linearGradient id="stripe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#C45C16"/>
              <stop offset="100%" stop-color="#A84A10"/>
            </linearGradient>
            <radialGradient id="shadow-g" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="rgba(40,20,8,0.28)"/>
              <stop offset="100%" stop-color="rgba(40,20,8,0)"/>
            </radialGradient>
          </defs>

          <ellipse class="ground-shadow" cx="84" cy="154" rx="44" ry="8" fill="url(#shadow-g)"/>

          <g class="tail">
            <path class="tail-line" d="M118 108 C148 100 152 70 138 46" fill="none" stroke="#E89432" stroke-width="13" stroke-linecap="round"/>
            <path d="M118 108 C148 100 152 70 138 46" fill="none" stroke="#C45C16" stroke-width="13" stroke-linecap="round" stroke-dasharray="0 10 7 11" opacity="0.85"/>
            <circle cx="138" cy="46" r="7.5" fill="#E89432"/>
            <circle cx="138" cy="46" r="4" fill="#C45C16"/>
          </g>

          <g class="body-group">
            <g class="leg leg-bl">
              <ellipse cx="70" cy="136" rx="8" ry="13" fill="#E89432" stroke="#C36A20" stroke-width="1"/>
              <ellipse cx="70" cy="146" rx="8.5" ry="5" fill="#FFF6E8"/>
            </g>
            <g class="leg leg-br">
              <ellipse cx="104" cy="136" rx="8" ry="13" fill="#E08A2C" stroke="#C36A20" stroke-width="1"/>
              <ellipse cx="104" cy="146" rx="8.5" ry="5" fill="#FFF6E8"/>
            </g>

            <g class="body">
              <ellipse cx="86" cy="114" rx="36" ry="30" fill="url(#fur)" stroke="#C36A20" stroke-width="1.2"/>
              <ellipse cx="84" cy="122" rx="20" ry="16" fill="#FFF3DC"/>
              <path d="M70 96 Q74 112 70 128" fill="none" stroke="url(#stripe)" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
              <path d="M86 94 Q90 114 86 132" fill="none" stroke="url(#stripe)" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
              <path d="M102 98 Q104 114 100 128" fill="none" stroke="url(#stripe)" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
            </g>

            <g class="leg leg-fl">
              <ellipse cx="74" cy="138" rx="7.5" ry="12" fill="#F0A045" stroke="#C36A20" stroke-width="1"/>
              <ellipse cx="74" cy="148" rx="8" ry="4.6" fill="#FFF6E8"/>
            </g>
            <g class="leg leg-fr">
              <ellipse cx="98" cy="138" rx="7.5" ry="12" fill="#E89432" stroke="#C36A20" stroke-width="1"/>
              <ellipse cx="98" cy="148" rx="8" ry="4.6" fill="#FFF6E8"/>
            </g>
          </g>

          <g class="head">
            <g class="ear ear-left">
              <path d="M54 52 L44 18 L78 44 Z" fill="#E89432" stroke="#C36A20" stroke-width="1.2" stroke-linejoin="round"/>
              <path d="M56 48 L50 26 L72 42 Z" fill="#F5B7A8"/>
            </g>
            <g class="ear ear-right">
              <path d="M114 52 L124 18 L90 44 Z" fill="#E08A2C" stroke="#C36A20" stroke-width="1.2" stroke-linejoin="round"/>
              <path d="M112 48 L118 26 L96 42 Z" fill="#F5B7A8"/>
            </g>

            <circle cx="84" cy="62" r="34" fill="url(#fur-head)" stroke="#C36A20" stroke-width="1.3"/>

            <g class="tabby-m">
              <path d="M84 34 L84 50" stroke="#C45C16" stroke-width="3.4" stroke-linecap="round"/>
              <path d="M72 36 Q76 44 74 52" fill="none" stroke="#C45C16" stroke-width="3.2" stroke-linecap="round"/>
              <path d="M96 36 Q92 44 94 52" fill="none" stroke="#C45C16" stroke-width="3.2" stroke-linecap="round"/>
            </g>
            <path d="M58 58 Q52 70 58 80" fill="none" stroke="#C45C16" stroke-width="3.4" stroke-linecap="round"/>
            <path d="M110 58 Q116 70 110 80" fill="none" stroke="#C45C16" stroke-width="3.4" stroke-linecap="round"/>

            <ellipse cx="84" cy="76" rx="16" ry="12" fill="#FFF6E8"/>

            <g class="blush">
              <ellipse cx="58" cy="74" rx="7" ry="4.2" fill="#F4A8A0" opacity="0.7"/>
              <ellipse cx="110" cy="74" rx="7" ry="4.2" fill="#F4A8A0" opacity="0.7"/>
            </g>

            <g class="eyes eyes-open">
              <g class="eye eye-left">
                <ellipse cx="70" cy="62" rx="8.5" ry="9.5" fill="#FFFDF8"/>
                <ellipse class="pupil" cx="71" cy="63" rx="5.2" ry="6.4" fill="#3A2416"/>
                <ellipse cx="71" cy="63" rx="2.4" ry="3.4" fill="#7A4A22"/>
                <circle cx="68.4" cy="59.2" r="2.1" fill="#fff"/>
                <circle cx="73.2" cy="65.5" r="0.9" fill="#fff" opacity="0.8"/>
              </g>
              <g class="eye eye-right">
                <ellipse cx="98" cy="62" rx="8.5" ry="9.5" fill="#FFFDF8"/>
                <ellipse class="pupil" cx="97" cy="63" rx="5.2" ry="6.4" fill="#3A2416"/>
                <ellipse cx="97" cy="63" rx="2.4" ry="3.4" fill="#7A4A22"/>
                <circle cx="94.4" cy="59.2" r="2.1" fill="#fff"/>
                <circle cx="99.2" cy="65.5" r="0.9" fill="#fff" opacity="0.8"/>
              </g>
            </g>

            <g class="eyes-closed" display="none">
              <path d="M62 62 Q70 68 78 62" fill="none" stroke="#3A2416" stroke-width="2.4" stroke-linecap="round"/>
              <path d="M90 62 Q98 68 106 62" fill="none" stroke="#3A2416" stroke-width="2.4" stroke-linecap="round"/>
            </g>
            <g class="eyes-happy" display="none">
              <path d="M62 64 Q70 56 78 64" fill="none" stroke="#3A2416" stroke-width="2.6" stroke-linecap="round"/>
              <path d="M90 64 Q98 56 106 64" fill="none" stroke="#3A2416" stroke-width="2.6" stroke-linecap="round"/>
            </g>
            <g class="eyes-sleep" display="none">
              <path d="M62 63 Q70 63 78 63" fill="none" stroke="#3A2416" stroke-width="2.2" stroke-linecap="round"/>
              <path d="M90 63 Q98 63 106 63" fill="none" stroke="#3A2416" stroke-width="2.2" stroke-linecap="round"/>
            </g>

            <path class="nose" d="M84 74 L79.5 79 Q84 82 88.5 79 Z" fill="#E8889A" stroke="#D56B80" stroke-width="0.6"/>
            <g class="mouth">
              <path d="M84 81 Q80 86 75 84" fill="none" stroke="#A05A40" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M84 81 Q88 86 93 84" fill="none" stroke="#A05A40" stroke-width="1.5" stroke-linecap="round"/>
            </g>
            <ellipse class="mouth-o" cx="84" cy="86" rx="3.2" ry="3.6" fill="#6B2E2E" opacity="0"/>

            <g class="whiskers" stroke="#D7B08A" stroke-width="1.1" fill="none" stroke-linecap="round">
              <path d="M48 76 H22"/>
              <path d="M50 82 H20"/>
              <path d="M52 88 H24"/>
              <path d="M120 76 H146"/>
              <path d="M118 82 H148"/>
              <path d="M116 88 H144"/>
            </g>

            <g class="paw-lick">
              <ellipse cx="64" cy="86" rx="8" ry="6" fill="#F0A045" stroke="#C36A20" stroke-width="1"/>
              <ellipse cx="62" cy="88" rx="6" ry="3.4" fill="#FFF6E8"/>
            </g>
          </g>
        </svg>
      </div>
    </div>
  `
}
