import type { MaterialDefinition } from '@/shared/types'

import { buttonMaterial } from './button'
import { carouselMaterial } from './carousel'
import { dividerMaterial } from './divider'
import { goodsMaterial } from './goods'
import { imageMaterial } from './image'
import { magicGridMaterial } from './magic-grid'
import { noticeBarMaterial } from './notice-bar'
import { spacerMaterial } from './spacer'
import { textMaterial } from './text'

/** 物料注册表:新增物料在此登记即可全局生效 */
export const materialList: MaterialDefinition[] = [
  textMaterial,
  imageMaterial,
  buttonMaterial,
  dividerMaterial,
  spacerMaterial,
  carouselMaterial,
  noticeBarMaterial,
  magicGridMaterial,
  goodsMaterial,
]

const materialMap = new Map(materialList.map((m) => [m.type, m]))

export function getMaterial(type: string): MaterialDefinition | undefined {
  return materialMap.get(type)
}
