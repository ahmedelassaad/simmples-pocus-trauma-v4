export const ASYNCHRONIES = [
  {
    name: 'Esforço Ineficaz', type: 'Disparo', curve: 'Curva de fluxo',
    finding: 'Deflexão na curva expiratória sem novo ciclo; o ventilador ignorou o esforço do paciente.',
    action: 'Tornar o trigger mais sensível. Em VCV/PCV, aliviar possível auto-PEEP aumentando tempo expiratório.'
  },
  {
    name: 'Duplo Disparo', type: 'Disparo', curve: 'Curva de pressão',
    finding: 'Dois ciclos consecutivos; tempo neural maior que o tempo inspiratório programado.',
    action: 'VCV: aumentar fluxo de pico ou volume corrente se permitido. PCV: aumentar tempo inspiratório.'
  },
  {
    name: 'Ciclagem Prematura', type: 'Ciclagem', curve: 'Curva de fluxo',
    finding: 'Expiração começa abruptamente com pico negativo; a máquina cortou o ar antes da hora.',
    action: 'VCV/PCV: aumentar tempo inspiratório. PSV: reduzir porcentagem de ciclagem.'
  },
  {
    name: 'Ciclagem Tardia', type: 'Ciclagem', curve: 'Curva de pressão',
    finding: 'Paciente quer expirar, mas a máquina continua; pode gerar “chifre” no final da inspiração.',
    action: 'VCV/PCV: reduzir tempo inspiratório. PSV: aumentar porcentagem de ciclagem.'
  },
  {
    name: 'Fome de Fluxo', type: 'Fluxo', curve: 'Curva de pressão',
    finding: 'Curva pressão-tempo abaulada para baixo, sugerindo fluxo inspiratório insuficiente.',
    action: 'VCV: aumentar fluxo inspiratório de pico. Em PCV/PSV, considerar ajuste de pressão de suporte/ΔP.'
  }
];
