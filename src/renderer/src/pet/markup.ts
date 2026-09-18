import { DEFAULT_FRAME } from './clips'

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
        <div class="ground-shadow" aria-hidden="true"></div>
        <div class="sprites">
          <img id="pet-frame" class="sprite" src="${DEFAULT_FRAME}" alt="" draggable="false" />
        </div>
      </div>
    </div>
  `
}
