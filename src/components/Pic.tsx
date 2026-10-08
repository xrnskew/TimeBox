import { pictureUrl } from '@/app/pictureUrl.ts'

/** Рисунок из набора TimeBox размером 1em — как смайлик, подстраивается под font-size родителя; клетки чёткие. */
export function Pic({ name, className }: { name: string; className?: string }) {
  return (
    <img
      className={className ? `pic ${className}` : 'pic'}
      src={pictureUrl(name)}
      alt=""
      draggable={false}
      data-pic={name}
    />
  )
}
