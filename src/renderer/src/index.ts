import './styles.css'
import { catMarkup } from './pet/markup'
import { PetEngine } from './engine/PetEngine'

const root = document.getElementById('app')
if (!root) {
  throw new Error('缺少 #app 根节点')
}

root.innerHTML = catMarkup()
const engine = new PetEngine(root)
if (window.deskpet) {
  void engine.start()
} else {
  console.warn('桌宠 API 未注入，仅预览立绘')
}
