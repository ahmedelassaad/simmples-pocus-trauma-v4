export const ASYNCHRONIES = [
  {
    name: 'Esforço Ineficaz',
    type: 'Disparo',
    curve: 'Fluxo-tempo e pressão-tempo',
    variant: 'ineffective',
    finding: 'Deflexão na curva expiratória sem novo ciclo: o paciente tentou disparar, mas o ventilador ignorou o esforço.',
    action: 'Tornar o trigger mais sensível. Investigar auto-PEEP, excesso de suporte, sedação profunda e tempo expiratório insuficiente.'
  },
  {
    name: 'Duplo Disparo',
    type: 'Disparo/ciclagem',
    curve: 'Pressão-tempo e volume-tempo',
    variant: 'doubleTrigger',
    finding: 'Dois ciclos consecutivos com pouca ou nenhuma expiração entre eles; tempo neural maior que o tempo inspiratório programado.',
    action: 'VCV: avaliar aumento de fluxo ou tempo inspiratório/ajuste de VT dentro de limites protetores. PCV/PSV: ajustar tempo inspiratório/ciclagem e demanda do paciente.'
  },
  {
    name: 'Ciclagem Prematura',
    type: 'Ciclagem',
    curve: 'Fluxo-tempo',
    variant: 'premature',
    finding: 'Expiração começa de forma abrupta enquanto o esforço inspiratório ainda parece ativo; pico negativo logo após a inspiração.',
    action: 'VCV/PCV: aumentar tempo inspiratório quando apropriado. PSV: reduzir porcentagem de ciclagem ou ajustar rise/PS conforme o caso.'
  },
  {
    name: 'Ciclagem Tardia',
    type: 'Ciclagem',
    curve: 'Pressão-tempo',
    variant: 'delayed',
    finding: 'Paciente quer expirar, mas a máquina continua insuflando; pode aparecer “chifre”/pressurização no final da inspiração.',
    action: 'VCV/PCV: reduzir tempo inspiratório. PSV: aumentar porcentagem de ciclagem e avaliar excesso de suporte.'
  },
  {
    name: 'Fome de Fluxo',
    type: 'Fluxo',
    curve: 'Pressão-tempo',
    variant: 'flowStarvation',
    finding: 'Curva pressão-tempo escavada/abaulada para baixo durante a inspiração, sugerindo fluxo inspiratório insuficiente para a demanda.',
    action: 'VCV: aumentar fluxo inspiratório de pico ou alterar padrão de fluxo. PCV/PSV: avaliar rise time, pressão de suporte/ΔP e drive respiratório.'
  }
];
