import './styles.css'
import { catMarkup } from './pet/markup'
import { PetEngine } from './engine/PetEngine'

const root = document.getElementById('app')
if (!root) {
  throw new Error('缺少 #app 根节点')
}

root.innerHTML = catMarkup()
const engine = new PetEngine(root)
void engine.start()
