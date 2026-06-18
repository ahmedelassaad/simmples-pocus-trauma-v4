import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, HeartPulse, Search, MapPinned, Ruler, ListChecks, Waves, Pause, Play } from 'lucide-react';
import { Card } from '../components/Layout.jsx';
import { Segmented } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';
import { EcgStrip, EcgTwelveLead } from '../components/EcgWaveforms.jsx';

const tabs = [
  { value: 'ritmos', label: 'Ritmos' },
  { value: 'bradi', label: 'Bradi' },
  { value: 'taqui', label: 'Taqui' },
  { value: 'iam', label: 'IAM/OMI' }
];

const rhythmDefaults = {
  normal: 'PR 120–200 ms • QRS < 120 ms • QTc dependente da FC',
  brady: 'FC < 60 bpm quando sinusal; avaliar PR, QRS e sintomas',
  tachy: 'FC geralmente > 100 bpm; diferenciar QRS estreito/largo e regularidade',
  omi: 'Avaliar supra/infra em derivações contíguas, recíprocas e padrões equivalentes de OMI'
};

const ECG_PATTERNS = [
  {
    id: 'sinus', tab: 'ritmos', name: 'Ritmo sinusal', rhythm: 'sinus', pattern: 'normal', rate: 75, type: 'Ritmo base',
    features: ['P positiva em DII', 'P antes de cada QRS', 'PR constante', 'QRS estreito'],
    explain: 'Ritmo regular com origem sinusal, ativação atrial organizada e condução AV preservada.',
    leads: 'DII costuma ser a melhor derivação de ritmo; P positiva em DI, DII e aVF e negativa em aVR.',
    criteria: ['FC 60–100 bpm', 'Onda P sinusal antes de cada QRS', 'Intervalo PR estável de 120–200 ms', 'QRS estreito, usualmente < 120 ms'],
    intervals: rhythmDefaults.normal,
    territory: 'Ritmo fisiológico; não define território isquêmico.'
  },
  {
    id: 'sinus-brady', tab: 'bradi', name: 'Bradicardia sinusal', rhythm: 'brady', pattern: 'normal', rate: 45, type: 'Bradiarritmia',
    features: ['P sinusal', 'FC < 60 bpm', 'PR constante', 'QRS estreito'],
    explain: 'Mesmo eixo e morfologia de ritmo sinusal, porém com frequência ventricular baixa.',
    leads: 'DII evidencia P sinusal; DI/aVF ajudam eixo; checar QRS em todas as derivações.',
    criteria: ['Onda P sinusal antes de cada QRS', 'FC < 60 bpm', 'PR constante', 'Sem batimentos bloqueados'],
    intervals: 'PR 120–200 ms se condução AV normal • QRS geralmente < 120 ms.',
    territory: 'Avaliar contexto: atleta, sono, medicações, IAM inferior, hipercalemia ou instabilidade.'
  },
  {
    id: 'first-avb', tab: 'bradi', name: 'BAV 1º grau', rhythm: 'brady', pattern: 'first-avb', rate: 58, type: 'Bradiarritmia',
    features: ['PR > 200 ms', 'Toda P conduz', 'QRS após cada P'],
    explain: 'A condução AV está atrasada, mas todos os impulsos atriais chegam aos ventrículos.',
    leads: 'Medir PR em DII ou V5, do início da P ao início do QRS, em vários ciclos.',
    criteria: ['Intervalo PR > 200 ms', 'Relação P:QRS 1:1', 'Sem pausas por P não conduzida', 'QRS pode ser estreito ou largo conforme local de doença'],
    intervals: 'PR > 200 ms é o marco; QRS < 120 ms se condução intraventricular preservada.',
    territory: 'Pode aparecer em vagotonia, fármacos nodais, doença degenerativa ou IAM inferior.'
  },
  {
    id: 'mobitz1', tab: 'bradi', name: 'BAV 2º grau Mobitz I', rhythm: 'brady', pattern: 'mobitz1', rate: 55, type: 'Bradiarritmia',
    features: ['PR aumenta progressivamente', 'P bloqueada', 'Pausas agrupadas'],
    explain: 'Padrão de Wenckebach: atraso AV progressivo até uma onda P não conduzir.',
    leads: 'DII longo ajuda a ver o encurtamento RR progressivo e a P bloqueada no fim do ciclo.',
    criteria: ['PR progressivamente mais longo antes da pausa', 'Uma P não seguida de QRS', 'Ciclos em grupos', 'Geralmente QRS estreito se bloqueio nodal'],
    intervals: 'PR variável e progressivo; pausa costuma ser menor que duas vezes o RR basal.',
    territory: 'Mais frequentemente nodal; pode ocorrer em IAM inferior ou uso de drogas nodais.'
  },
  {
    id: 'mobitz2', tab: 'bradi', name: 'BAV 2º grau Mobitz II', rhythm: 'brady', pattern: 'mobitz2', rate: 50, type: 'Bradiarritmia',
    features: ['PR fixo', 'P subitamente não conduzida', 'QRS pode ser largo'],
    explain: 'Bloqueio intermitente com condução tudo-ou-nada; maior risco de progressão para BAV total.',
    leads: 'DII identifica P bloqueada; V1/V6 ajudam a ver se há QRS largo por doença infranodal.',
    criteria: ['PR constante nos batimentos conduzidos', 'P bloqueada sem alongamento prévio do PR', 'Pode haver condução 2:1', 'QRS largo sugere doença His-Purkinje'],
    intervals: 'PR fixo nos batimentos conduzidos; QRS pode ser ≥ 120 ms se infranodal.',
    territory: 'Considerar doença de condução avançada, IAM anterior ou degeneração do sistema His-Purkinje.'
  },
  {
    id: 'complete-av', tab: 'bradi', name: 'BAV total', rhythm: 'brady', pattern: 'complete-av', rate: 38, type: 'Bradiarritmia',
    features: ['Dissociação AV', 'P e QRS independentes', 'Ritmo de escape'],
    explain: 'Não há condução AV efetiva; átrios e ventrículos batem de forma independente.',
    leads: 'DII longo ajuda a perceber P marchando independentemente; V1/V6 avaliam largura do escape.',
    criteria: ['Frequência atrial maior que ventricular', 'Intervalo PR variável sem padrão', 'QRS estreito se escape juncional; largo se ventricular', 'P pode cair antes, dentro ou depois do QRS'],
    intervals: 'PR sem relação fixa; QRS estreito no escape alto e largo no escape ventricular.',
    territory: 'Instabilidade depende da frequência e do escape; associar contexto de IAM inferior/anterior e fármacos.'
  },
  {
    id: 'junctional', tab: 'bradi', name: 'Ritmo juncional', rhythm: 'junctional', pattern: 'junctional', rate: 48, type: 'Bradiarritmia',
    features: ['P ausente ou retrógrada', 'QRS estreito', 'FC 40–60 bpm se escape'],
    explain: 'O marcapasso está próximo ao nó AV; a onda P pode desaparecer, inverter ou surgir após o QRS.',
    leads: 'P retrógrada costuma ser negativa em DII, DIII e aVF quando visível.',
    criteria: ['QRS geralmente estreito', 'P ausente, invertida antes do QRS ou depois do QRS', 'Escape juncional costuma ficar entre 40–60 bpm'],
    intervals: 'PR ausente ou curto se P retrógrada antes do QRS; QRS geralmente < 120 ms.',
    territory: 'Pode ser escape protetor em bradicardia sinusal/BAV ou ritmo ativo conforme frequência.'
  },
  {
    id: 'afib', tab: 'ritmos', name: 'Fibrilação atrial', rhythm: 'afib', pattern: 'normal', rate: 125, type: 'Ritmo irregular',
    features: ['Irregularmente irregular', 'Sem P organizada', 'Linha de base fibrilatória'],
    explain: 'Ativação atrial caótica com resposta ventricular variável e ausência de onda P sinusal.',
    leads: 'DII e V1 costumam facilitar a visualização da ausência de P e das ondas fibrilatórias.',
    criteria: ['Intervalos RR irregularmente irregulares', 'Ausência de P organizada', 'QRS estreito salvo aberrância/bloqueio', 'Resposta ventricular variável'],
    intervals: 'PR não mensurável; QRS geralmente < 120 ms se sem aberrância.',
    territory: 'Diferenciar de flutter com condução variável e de extrassístoles frequentes.'
  },
  {
    id: 'flutter', tab: 'taqui', name: 'Flutter atrial', rhythm: 'flutter', pattern: 'normal', rate: 150, type: 'Taquiarritmia supraventricular',
    features: ['Ondas F serrilhadas', 'Condução 2:1 comum', 'FC perto de 150 bpm'],
    explain: 'Macro-reentrada atrial; pode parecer TSV regular quando a condução AV é 2:1.',
    leads: 'Ondas F ficam mais claras em DII, DIII, aVF e V1.',
    criteria: ['Atividade atrial regular em serrilha', 'Frequência atrial usual ao redor de 250–350 bpm', 'Condução AV 2:1, 3:1 ou variável', 'QRS estreito se sem aberrância'],
    intervals: 'PR não é interpretável; QRS geralmente < 120 ms se condução normal.',
    territory: 'Adenosina pode revelar ondas F, mas não é terapia definitiva do circuito.'
  },
  {
    id: 'svt', tab: 'taqui', name: 'TSV regular', rhythm: 'svt', pattern: 'normal', rate: 170, type: 'Taquiarritmia supraventricular',
    features: ['Regular', 'QRS estreito', 'P não evidente ou retrógrada'],
    explain: 'Taquicardia regular de QRS estreito, frequentemente por reentrada nodal ou via acessória.',
    leads: 'DII pode mostrar pseudo-S; V1 pode mostrar pseudo-r’ em AVNRT.',
    criteria: ['Ritmo muito regular', 'QRS < 120 ms', 'Ondas P ocultas ou retrógradas', 'Início/término frequentemente abruptos'],
    intervals: 'QRS estreito; PR geralmente não mensurável durante a taquicardia.',
    territory: 'Diferenciar de flutter 2:1, taquicardia atrial e taquicardia sinusal.'
  },
  {
    id: 'vt', tab: 'taqui', name: 'Taquicardia ventricular monomórfica', rhythm: 'vt', pattern: 'normal', rate: 165, type: 'Taquiarritmia ventricular',
    features: ['QRS largo', 'Regular', 'Morfologia monomórfica', 'Dissociação AV pode aparecer'],
    explain: 'Taquicardia regular de QRS largo deve ser considerada ventricular até prova em contrário.',
    leads: 'V1 e V6 ajudam na morfologia; DII pode mostrar dissociação AV ou captura/fusão quando presentes.',
    criteria: ['QRS ≥ 120 ms', 'Ritmo regular de QRS largo', 'Concordância precordial ou critérios morfológicos podem apoiar TV', 'História de cardiopatia aumenta probabilidade'],
    intervals: 'QRS largo; PR geralmente não aplicável por dissociação AV.',
    territory: 'Diferenciar de TSV com aberrância, mas em emergência tratar como TV se dúvida.'
  },
  {
    id: 'torsades', tab: 'taqui', name: 'Torsades de pointes', rhythm: 'torsades', pattern: 'normal', rate: 190, type: 'TV polimórfica',
    features: ['QRS largo polimórfico', 'Amplitude muda em ondas', 'Associada a QT longo'],
    explain: 'TV polimórfica em que o eixo e a amplitude parecem torcer ao redor da linha de base.',
    leads: 'O padrão é visto globalmente; medir QT no ECG prévio/entre episódios quando possível.',
    criteria: ['Taquicardia ventricular polimórfica', 'Variação cíclica de amplitude/eixo', 'Contexto típico de QT prolongado', 'Pode degenerar em FV'],
    intervals: 'QTc prolongado é pista importante fora do episódio; durante a TV não há intervalos confiáveis.',
    territory: 'Pensar em drogas, hipocalemia, hipomagnesemia, bradicardia e QT longo congênito.'
  },
  {
    id: 'vf', tab: 'taqui', name: 'Fibrilação ventricular', rhythm: 'vf', pattern: 'normal', rate: 240, type: 'Ritmo de PCR',
    features: ['Caótico', 'Sem QRS organizado', 'Sem pulso efetivo'],
    explain: 'Atividade ventricular desorganizada sem complexos QRS reconhecíveis e sem débito efetivo.',
    leads: 'Aparência caótica em todas as derivações; confirmar cabos/artefato no contexto clínico.',
    criteria: ['Ausência de QRS/P/T organizados', 'Linha irregular caótica', 'Paciente sem pulso no contexto de PCR'],
    intervals: 'Intervalos não mensuráveis.',
    territory: 'Ritmo chocável no algoritmo de PCR.'
  },
  {
    id: 'stemi-anterior', tab: 'iam', name: 'IAM com supra anterior', rhythm: 'sinus', pattern: 'stemi-anterior', rate: 86, type: 'IAM com supra',
    features: ['Supra em V2–V4/V5', 'T hiperagudas', 'Recíproca inferior pode ocorrer'],
    explain: 'Padrão de injúria transmural anterior, frequentemente relacionado à DA, no contexto clínico adequado.',
    leads: 'V2–V4 são centrais; V1/V5 podem ampliar extensão. São 3 ou mais derivações precordiais contíguas.',
    criteria: ['Supra no ponto J em derivações precordiais contíguas', 'T hiperagudas ou perda de progressão de R podem coexistir', 'Recíprocas inferiores reforçam especificidade'],
    intervals: rhythmDefaults.omi,
    territory: 'Território anterior/septal; provável artéria descendente anterior.'
  },
  {
    id: 'stemi-inferior', tab: 'iam', name: 'IAM com supra inferior', rhythm: 'sinus', pattern: 'stemi-inferior', rate: 82, type: 'IAM com supra',
    features: ['Supra em DII, DIII, aVF', 'Recíproca em DI/aVL', 'DIII > DII sugere RCA'],
    explain: 'Padrão inferior clássico com supra em derivações contíguas inferiores.',
    leads: 'DII, DIII e aVF: 3 derivações inferiores contíguas; DI/aVL são recíprocas laterais altas.',
    criteria: ['Supra em pelo menos duas derivações inferiores contíguas', 'Infra recíproco em DI/aVL aumenta confiança', 'Avaliar V3R/V4R e V7–V9 quando indicado'],
    intervals: rhythmDefaults.omi,
    territory: 'Território inferior; RCA ou circunflexa conforme dominância e padrão.'
  },
  {
    id: 'stemi-lateral', tab: 'iam', name: 'IAM lateral alto/lateral', rhythm: 'sinus', pattern: 'stemi-lateral', rate: 88, type: 'IAM com supra',
    features: ['Supra em DI/aVL', 'Supra em V5–V6', 'Recíproca inferior'],
    explain: 'Padrão lateral que pode ser sutil, especialmente em DI/aVL, e depende de recíprocas.',
    leads: 'DI/aVL são lateral alto; V5–V6 lateral baixo. Duas ou mais derivações contíguas apoiam o diagnóstico.',
    criteria: ['Supra em DI/aVL e/ou V5–V6', 'Infra em DIII/aVF pode ser recíproco', 'Procurar extensão anterior/posterior conforme contexto'],
    intervals: rhythmDefaults.omi,
    territory: 'Diagonal, circunflexa ou ramos marginais/obtusos.'
  },
  {
    id: 'posterior', tab: 'iam', name: 'IAM posterior', rhythm: 'sinus', pattern: 'stemi-posterior', rate: 85, type: 'IAM equivalente',
    features: ['Infra horizontal V1–V3', 'R alto em V1–V3', 'T positiva anterior', 'Confirmar V7–V9'],
    explain: 'ECG anterior mostra imagem em espelho do supra posterior; derivações V7–V9 podem confirmar.',
    leads: 'V1–V3 são as derivações afetadas no 12 derivações padrão; V7–V9 avaliam a parede posterior diretamente.',
    criteria: ['Infra horizontal/descendente em V1–V3', 'R alto e T positiva em V1–V3', 'Supra posterior em V7–V9 quando registradas'],
    intervals: rhythmDefaults.omi,
    territory: 'Parede posterior; frequentemente circunflexa ou RCA dominante.'
  },
  {
    id: 'rv', tab: 'iam', name: 'Infarto de VD', rhythm: 'sinus', pattern: 'rv-infarct', rate: 78, type: 'Extensão de IAM inferior',
    features: ['Supra inferior', 'Supra em V1', 'V4R positivo quando registrado'],
    explain: 'Suspeitar em IAM inferior com hipotensão, pulmões limpos e sinais de dependência de pré-carga.',
    leads: 'No ECG padrão: DII/DIII/aVF e V1. A confirmação clássica usa V3R–V4R, especialmente V4R.',
    criteria: ['IAM inferior associado', 'Supra em V1 pode sugerir VD', 'Supra em V4R reforça diagnóstico', 'Considerar posterior concomitante se V1–V3 com infra'],
    intervals: rhythmDefaults.omi,
    territory: 'Ventrículo direito; geralmente oclusão proximal de RCA.'
  },
  {
    id: 'de-winter', tab: 'iam', name: 'De Winter', rhythm: 'sinus', pattern: 'de-winter', rate: 92, type: 'Oclusão coronariana',
    features: ['Infra ascendente V1–V6', 'T altas e simétricas', 'aVR pode ter supra'],
    explain: 'Padrão compatível com oclusão proximal da DA sem supra clássico inicial.',
    leads: 'Predomina em V2–V6, frequentemente 4 ou mais precordiais; aVR pode ter pequeno supra.',
    criteria: ['Infra ascendente no ponto J em precordiais', 'Ondas T altas, simétricas e proeminentes', 'Ausência de supra clássico não exclui OMI'],
    intervals: rhythmDefaults.omi,
    territory: 'Oclusão de DA, muitas vezes proximal.'
  },
  {
    id: 'wellens-a', tab: 'iam', name: 'Wellens A', rhythm: 'sinus', pattern: 'wellens-a', rate: 70, type: 'Reperfusão/LAD crítica',
    features: ['T bifásica V2–V3', 'Pouco ou nenhum supra', 'Dor pode ter resolvido'],
    explain: 'Padrão de reperfusão/estenose crítica de DA proximal, geralmente visto quando a dor já melhorou.',
    leads: 'V2–V3 são essenciais; pode estender para V1, V4–V6. Geralmente 2 derivações anteriores contíguas.',
    criteria: ['T bifásica em V2–V3', 'Sem perda importante de R ou supra persistente marcante', 'História de dor torácica recente', 'Troponina pode ser normal ou discretamente elevada'],
    intervals: 'PR/QRS usualmente normais; foco é morfologia de T anterior.',
    territory: 'Lesão crítica de DA proximal; alto risco de IAM anterior extenso.'
  },
  {
    id: 'wellens-b', tab: 'iam', name: 'Wellens B', rhythm: 'sinus', pattern: 'wellens-b', rate: 70, type: 'Reperfusão/LAD crítica',
    features: ['T profundamente invertida V2–V4', 'Simétrica', 'Dor pode estar ausente'],
    explain: 'Variante com inversão profunda e simétrica de T em precordiais anteriores.',
    leads: 'V2–V4 são mais típicas; pode alcançar V1–V6. Normalmente múltiplas derivações precordiais contíguas.',
    criteria: ['T profundamente invertida e simétrica em V2–V3/V4', 'Sem supra persistente marcante', 'Contexto de angina recente resolvida', 'Pouca ou nenhuma onda Q'],
    intervals: 'PR/QRS usualmente normais; foco é repolarização anterior.',
    territory: 'DA proximal crítica/reperfusão espontânea.'
  },
  {
    id: 'aslanger', tab: 'iam', name: 'Aslanger', rhythm: 'sinus', pattern: 'aslanger', rate: 88, type: 'Oclusão inferior sutil',
    features: ['Supra isolado em DIII', 'Infra em V4–V6', 'V1 com ST maior que V2'],
    explain: 'Padrão de OMI inferior sutil que pode não cumprir STEMI clássico em duas derivações contíguas.',
    leads: 'DIII é a única inferior com supra; V4–V6 têm infra com T terminal positiva; V1 fica maior que V2.',
    criteria: ['Supra isolado em DIII, sem supra em DII/aVF', 'Infra em alguma de V4–V6 com T terminal positiva', 'ST em V1 maior que em V2'],
    intervals: rhythmDefaults.omi,
    territory: 'Inferior/OMI com doença multiarterial ou isquemia subendocárdica associada.'
  },
  {
    id: 'south-african-flag', tab: 'iam', name: 'Sinal da África do Sul', rhythm: 'sinus', pattern: 'south-african-flag', rate: 88, type: 'Oclusão diagonal/lateral alta',
    features: ['Supra em DI, aVL e V2', 'Infra em DIII/aVF', 'Padrão “bandeira” no Cabrera'],
    explain: 'Padrão visual associado a oclusão de ramo diagonal ou lateral alto.',
    leads: 'DI, aVL e V2 formam o padrão principal; DIII/aVF costumam mostrar recíproca inferior.',
    criteria: ['Supra em DI e aVL', 'Supra em V2 desproporcional ao restante das precordiais', 'Infra recíproco inferior', 'V3–V6 podem não ter supra marcante'],
    intervals: rhythmDefaults.omi,
    territory: 'Diagonal/lateral alto, frequentemente ramo diagonal da DA.'
  },
  {
    id: 'left-main', tab: 'iam', name: 'Tronco / multiarterial', rhythm: 'sinus', pattern: 'left-main-avr', rate: 96, type: 'Isquemia difusa',
    features: ['Supra em aVR', 'Infra difuso', 'Pode ter supra em V1'],
    explain: 'Padrão de isquemia subendocárdica difusa; não é sinônimo automático de tronco, mas exige atenção.',
    leads: 'aVR/V1 podem ter supra; DI, DII, aVL, aVF e V4–V6 costumam ter infra difuso.',
    criteria: ['Infra em múltiplas derivações de diferentes territórios', 'Supra em aVR, às vezes V1', 'Pensar em tronco, DA proximal, multiarterial, choque ou mismatch oferta-demanda'],
    intervals: rhythmDefaults.omi,
    territory: 'Isquemia global/subendocárdica; tronco de coronária esquerda é um dos diagnósticos possíveis.'
  },
  {
    id: 'hyperacute', tab: 'iam', name: 'Ondas T hiperagudas', rhythm: 'sinus', pattern: 'hyperacute-t', rate: 84, type: 'OMI precoce',
    features: ['T largas e volumosas', 'Desproporcionais ao QRS', 'Pode preceder supra'],
    explain: 'Alteração precoce de OMI: ondas T ficam amplas, largas, simétricas e desproporcionais.',
    leads: 'Aparecem nas derivações do território ocluído; no simulador, anterior e inferior são destacadas.',
    criteria: ['T nova, larga e simétrica', 'Amplitude desproporcional ao QRS/ST', 'Pode anteceder supra evidente', 'Comparação com ECG prévio ajuda muito'],
    intervals: rhythmDefaults.omi,
    territory: 'Território depende das derivações afetadas; pode ser fase inicial de oclusão.'
  },
  {
    id: 'lbbb', tab: 'iam', name: 'BRE / Sgarbossa', rhythm: 'sinus', pattern: 'lbbb', rate: 78, type: 'QRS largo com isquemia difícil',
    features: ['QRS ≥ 120 ms', 'QS/rS em V1', 'R largo em DI/V6', 'Aplicar Sgarbossa'],
    explain: 'No bloqueio de ramo esquerdo, a repolarização é secundária ao QRS; procurar concordância ou discordância excessiva.',
    leads: 'V1–V3 costumam ter complexo negativo; DI, aVL, V5–V6 têm R largo. Avaliar ST concordante/discordante nesses grupos.',
    criteria: ['QRS ≥ 120 ms', 'R amplo/entalhado em DI, aVL, V5–V6', 'QS ou rS em V1', 'Sgarbossa: supra concordante, infra concordante V1–V3 ou discordância excessiva'],
    intervals: 'QRS ≥ 120 ms; PR pode ser normal ou alterado conforme condução AV.',
    territory: 'O diagnóstico de OMI exige integração com sintomas, ECG prévio e critérios de Sgarbossa/modificado.'
  },
  {
    id: 'rbbb', tab: 'ritmos', name: 'BRD', rhythm: 'sinus', pattern: 'rbbb', rate: 76, type: 'Condução intraventricular',
    features: ['QRS ≥ 120 ms', 'rSR’ em V1', 'S ampla em DI/V6', 'T negativa V1–V3'],
    explain: 'A ativação terminal do ventrículo direito fica atrasada, alargando o QRS com padrão típico em V1.',
    leads: 'V1 mostra rSR’/R’ terminal; DI, V5 e V6 mostram S terminal larga.',
    criteria: ['QRS ≥ 120 ms se completo', 'rsR’ ou R terminal em V1–V2', 'S terminal larga em DI/V6', 'Alterações secundárias de ST-T em V1–V3'],
    intervals: 'QRS ≥ 120 ms no BRD completo; PR não necessariamente alterado.',
    territory: 'Importante em dor torácica, TEP e taquicardia de QRS largo.'
  },
  {
    id: 'brugada', tab: 'ritmos', name: 'Brugada tipo 1', rhythm: 'sinus', pattern: 'brugada', rate: 76, type: 'Padrão canalopatia',
    features: ['Supra em cúpula V1–V2', 'T negativa', 'Padrão em sela/cúpula direita'],
    explain: 'Padrão de repolarização coved nas precordiais direitas, que precisa de correlação clínica.',
    leads: 'V1–V2 são as derivações-chave; posicionamento alto de V1–V2 pode aumentar sensibilidade.',
    criteria: ['Elevação do ponto J/ST ≥ 2 mm em V1–V2', 'Morfologia em cúpula descendente', 'T negativa nas derivações direitas', 'Pode ser espontâneo ou induzido por febre/drogas'],
    intervals: 'QRS pode simular BRD incompleto; PR geralmente não é o foco.',
    territory: 'Canalopatia; diferenciar de BRD, isquemia, pericardite e alterações por eletrodo alto.'
  },
  {
    id: 'hyperk', tab: 'ritmos', name: 'Hipercalemia', rhythm: 'sinus', pattern: 'hyperkalemia', rate: 68, type: 'Distúrbio metabólico',
    features: ['T apiculada', 'P achatada', 'PR prolongando', 'QRS alargando'],
    explain: 'A toxicidade elétrica por potássio pode evoluir de T apiculada para alargamento de QRS e padrão sine-wave.',
    leads: 'T apiculada pode ser difusa; comparar com território único ajuda a diferenciar de OMI hiperaguda.',
    criteria: ['Ondas T altas, estreitas e pontiagudas', 'Redução/desaparecimento de P', 'PR prolongado e QRS alargado em casos graves', 'Progressão pode ser rápida'],
    intervals: 'PR pode aumentar; QRS pode ficar ≥ 120 ms nos quadros graves.',
    territory: 'Distúrbio sistêmico, não territorial; checar potássio, função renal e contexto.'
  },
  {
    id: 'wpw', tab: 'taqui', name: 'Pré-excitação / WPW', rhythm: 'sinus', pattern: 'wpw', rate: 78, type: 'Via acessória',
    features: ['PR curto', 'Onda delta', 'QRS alargado inicial'],
    explain: 'A ativação ventricular começa precocemente por via acessória, criando subida lenta inicial do QRS.',
    leads: 'Delta pode ser vista em várias derivações; V1 e derivações inferiores ajudam sugerir localização da via.',
    criteria: ['PR < 120 ms', 'Onda delta no início do QRS', 'QRS alargado por fusão', 'Repolarização secundária pode simular isquemia'],
    intervals: 'PR < 120 ms; QRS frequentemente ≥ 110–120 ms por pré-excitação.',
    territory: 'Muda a conduta em FA pré-excitada e taquicardias por via acessória.'
  },
  {
    id: 'paced', tab: 'ritmos', name: 'Ritmo de marcapasso ventricular', rhythm: 'paced', pattern: 'paced', rate: 70, type: 'Ritmo estimulado',
    features: ['Espícula antes do QRS', 'QRS largo', 'Morfologia tipo BRE comum'],
    explain: 'Complexos ventriculares estimulados por marcapasso costumam ter QRS largo e repolarização secundária.',
    leads: 'Espículas podem ser sutis; V1/V6 mostram morfologia semelhante a BRE quando pacing de VD.',
    criteria: ['Espícula precedendo QRS', 'QRS largo após captura', 'ST-T secundário discordante', 'Avaliar falha de captura/sensibilidade se espícula sem QRS'],
    intervals: 'PR não se aplica em pacing ventricular isolado; QRS largo é esperado.',
    territory: 'Isquemia em ritmo estimulado requer critérios específicos e comparação com ECG prévio.'
  },
  {
    id: 'asystole', tab: 'taqui', name: 'Assistolia', rhythm: 'asystole', pattern: 'normal', rate: 0, type: 'Ritmo de PCR',
    features: ['Linha quase isoelétrica', 'Sem QRS organizado', 'Confirmar cabos/ganho'],
    explain: 'Ausência de atividade ventricular organizada. Sempre confirmar em mais de uma derivação e excluir artefato/cabo solto.',
    leads: 'Checar em múltiplas derivações; uma linha reta isolada pode ser problema técnico.',
    criteria: ['Sem complexos QRS', 'Sem ritmo organizado', 'Paciente sem pulso no contexto clínico', 'Confirmar cabo, ganho e derivação'],
    intervals: 'Intervalos não mensuráveis.',
    territory: 'Ritmo não chocável no algoritmo de PCR.'
  }
];



const ECG_PEARLS = {
  'sinus': { firstLook: 'Confirme P antes de cada QRS, regularidade e PR constante.', pitfall: 'Taquicardia sinusal com P escondida pode confundir com TSV se a FC estiver alta.', action: 'Use como padrão de comparação para repolarização e progressão de R.' },
  'sinus-brady': { firstLook: 'Olhe FC, relação P-QRS e sintomas/instabilidade.', pitfall: 'Bradicardia sinusal não exclui IAM inferior, drogas nodais ou hipercalemia.', action: 'Correlacione com perfusão e causas reversíveis.' },
  'first-avb': { firstLook: 'Meça o PR em DII ou V5 em mais de um ciclo.', pitfall: 'PR discretamente longo pode passar despercebido se o papel visual estiver corrido.', action: 'Contextualize com medicações, vagotonia e doença de condução.' },
  'mobitz1': { firstLook: 'Procure alongamento progressivo do PR antes da pausa.', pitfall: 'Condução 2:1 pode esconder Wenckebach.', action: 'Observe estabilidade e contexto de IAM inferior ou drogas.' },
  'mobitz2': { firstLook: 'P bloqueada súbita com PR fixo nos batimentos conduzidos.', pitfall: 'Pode ser confundido com Wenckebach se poucos ciclos forem vistos.', action: 'Valorize como bloqueio de maior risco, especialmente com QRS largo.' },
  'complete-avb': { firstLook: 'Dissociação AV: P e QRS marchando independentemente.', pitfall: 'Batimentos de escape podem mascarar a gravidade se a FC não estiver muito baixa.', action: 'Checar perfusão e considerar pacing conforme contexto.' },
  'afib': { firstLook: 'Irregularmente irregular e sem P organizada.', pitfall: 'Extras frequentes podem simular irregularidade se o traçado for curto.', action: 'Avalie QRS largo, pré-excitação, frequência e instabilidade.' },
  'flutter': { firstLook: 'Ondas F serrilhadas em DII, DIII, aVF e V1.', pitfall: 'Condução 2:1 pode parecer TSV regular de ~150 bpm.', action: 'Busque relação A:V e resposta ventricular.' },
  'svt': { firstLook: 'Ritmo regular, geralmente estreito e muito rápido.', pitfall: 'TSV pode esconder ondas P retrógradas e parecer apenas taquicardia sinusal intensa.', action: 'Diferencie de flutter 2:1 e taquicardia atrial.' },
  'vt': { firstLook: 'Assuma TV até prova em contrário em taquicardia regular de QRS largo.', pitfall: 'Aberrância pode confundir, mas o erro seguro é tratar como TV.', action: 'Procure dissociação AV, capturas/fusões e estabilidade hemodinâmica.' },
  'vf': { firstLook: 'Atividade caótica sem QRS organizado nem linha de base estável.', pitfall: 'Artefato grosseiro pode simular FV; confirme no contexto de PCR.', action: 'Ritmo chocável: reconhecer rápido e seguir algoritmo de PCR.' },
  'torsades': { firstLook: 'Polimorfismo com amplitude que gira em torno da linha de base.', pitfall: 'TV polimórfica sem QT longo pode parecer semelhante.', action: 'Pense em QT prolongado, eletrólitos e drogas desencadeantes.' },
  'stemi-anterior': { firstLook: 'V2–V4/V5 com supra e T hiperagudas.', pitfall: 'Repolarização precoce e pericardite entram no diferencial.', action: 'Correlacione com dor, recíprocas e progressão de R.' },
  'stemi-inferior': { firstLook: 'DII, DIII e aVF com supra; DIII>DII sugere RCA.', pitfall: 'Supra discreto inferior pode ser subestimado sem recíprocas em DI/aVL.', action: 'Lembre de VD e parede posterior.' },
  'posterior': { firstLook: 'Infra horizontal V1–V3 com R alto e T positiva.', pitfall: 'Pode ser interpretado como isquemia subendocárdica anterior comum.', action: 'Registre V7–V9 se possível.' },
  'de-winter': { firstLook: 'Infra ascendente precordial + T altas e simétricas.', pitfall: 'Sem supra clássico, pode atrasar reconhecimento de oclusão.', action: 'Trate como equivalente de OMI.' },
  'wellens-a': { firstLook: 'T bifásica em V2–V3, muitas vezes após melhora da dor.', pitfall: 'O ECG pode parecer “melhorando” quando na verdade indica DA crítica.', action: 'Evite teste ergométrico; alto risco de IAM anterior.' },
  'wellens-b': { firstLook: 'T profundamente invertida e simétrica em V2–V4.', pitfall: 'Pode ser lido apenas como alteração inespecífica de repolarização.', action: 'Contexto de dor recente resolvida é essencial.' },
  'aslanger': { firstLook: 'Supra isolado em DIII com infra lateral e V1>V2.', pitfall: 'Não cumprir STEMI clássico não exclui oclusão.', action: 'Integre o conjunto do traçado e a clínica.' },
  'south-african-flag': { firstLook: 'I, aVL e V2 com supra e recíproca inferior.', pitfall: 'Foco apenas nas precordiais pode perder o padrão lateral alto.', action: 'Pense em oclusão diagonal/lateral alta.' },
  'left-main': { firstLook: 'aVR com supra e infra difuso em múltiplos territórios.', pitfall: 'Não é diagnóstico exclusivo de tronco; pode ser mismatch oferta-demanda.', action: 'Valorize gravidade clínica e contexto hemodinâmico.' },
  'hyperacute': { firstLook: 'T amplas, volumosas e desproporcionais ao QRS.', pitfall: 'Podem ser confundidas com hipercalemia se o contexto não for considerado.', action: 'Compare com ECG prévio e evolução seriada.' },
  'lbbb': { firstLook: 'QRS largo com morfologia típica e ST-T secundários.', pitfall: 'Repolarização secundária pode mascarar ou simular isquemia.', action: 'Use Sgarbossa e o contexto clínico.' },
  'rbbb': { firstLook: 'rSR’ em V1 e S terminal em I/V6.', pitfall: 'BRD pode coexistir com IAM e desviar a atenção.', action: 'Leia o ST mesmo em presença de bloqueio.' },
  'brugada': { firstLook: 'Supra em cúpula V1–V2 com T negativa.', pitfall: 'Fenocópias e posicionamento alto dos eletrodos podem enganar.', action: 'Correlacione com febre, síncope e história familiar.' },
  'hyperk': { firstLook: 'T apiculadas difusas, P achatada e QRS alargando progressivamente.', pitfall: 'T hiperaguda territorial pode confundir com hipercalemia.', action: 'Pense em toxicidade elétrica e trate cedo.' },
  'wpw': { firstLook: 'PR curto e onda delta no início do QRS.', pitfall: 'Pode simular IAM antigo ou alargamento inespecífico do QRS.', action: 'Atenção especial se houver FA pré-excitada.' },
  'paced': { firstLook: 'Espícula precedendo QRS largo com morfologia de pacing.', pitfall: 'Espículas sutis podem passar despercebidas em ganho baixo.', action: 'Se suspeita de isquemia, leia com critérios específicos e ECG prévio.' },
  'asystole': { firstLook: 'Confirme em mais de uma derivação e cheque cabos/ganho.', pitfall: 'Cabo solto e ganho inadequado podem simular assistolia.', action: 'Ritmo não chocável: seguir algoritmo após confirmar.' }
};

const ECG_ALIASES = {
  'torsades': ['torsade', 'torsades de pointes', 'torsade de pointes', 'tv polimorfica', 'taquicardia polimorfica', 'qt longo'],
  'vf': ['fibrilacao ventricular', 'fibrilacao venticular', 'fv', 'ritmo chocavel'],
  'vt': ['taquicardia ventricular', 'tv', 'qrs largo regular'],
  'afib': ['fibrilacao atrial', 'fa', 'irregularmente irregular'],
  'flutter': ['flutter atrial', 'serrilhado', 'dente de serra'],
  'complete-avb': ['bav total', 'bloqueio av total', 'bloqueio atrioventricular completo', 'dissociacao av'],
  'mobitz1': ['mobitz 1', 'wenckebach', 'bav segundo grau tipo 1'],
  'mobitz2': ['mobitz 2', 'bav segundo grau tipo 2'],
  'first-avb': ['bav primeiro grau', 'pr longo', 'bloqueio av primeiro grau'],
  'stemi-anterior': ['iam anterior', 'infarto anterior', 'supra anterior', 'da proximal'],
  'stemi-inferior': ['iam inferior', 'infarto inferior', 'supra inferior'],
  'stemi-lateral': ['iam lateral', 'infarto lateral', 'supra lateral'],
  'posterior': ['iam posterior', 'infarto posterior', 'v7 v9'],
  'de-winter': ['de winter', 'dewinter', 'da oclusa sem supra'],
  'wellens-a': ['wellens a', 't bifasica v2 v3'],
  'wellens-b': ['wellens b', 't invertida v2 v4'],
  'aslanger': ['aslanger', 'aslangher', 'aslanger pattern'],
  'south-african-flag': ['africa do sul', 'bandeira da africa do sul', 'south african flag'],
  'left-main': ['avr supra', 'tronco', 'multiarterial', 'infra difuso'],
  'hyperk': ['hipercalemia', 'potassio alto', 't apiculada'],
  'brugada': ['brugada', 'coved v1 v2'],
  'wpw': ['wpw', 'wolf parkinson white', 'pre excitacao', 'onda delta'],
  'rbbb': ['brd', 'bloqueio ramo direito'],
  'lbbb': ['bre', 'bloqueio ramo esquerdo', 'sgarbossa']
};

function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      previous = current;
    }
  }
  return row[b.length];
}

function fuzzyTokenScore(queryToken, targetToken) {
  if (!queryToken || !targetToken) return 0;
  if (targetToken === queryToken) return 1;
  if (targetToken.startsWith(queryToken) || queryToken.startsWith(targetToken)) return 0.92;
  if (targetToken.includes(queryToken) || queryToken.includes(targetToken)) return 0.84;
  const distance = levenshtein(queryToken, targetToken);
  const ratio = 1 - distance / Math.max(queryToken.length, targetToken.length);
  return ratio >= 0.58 ? ratio : 0;
}

function searchScore(item, query) {
  const q = normalizeSearch(query);
  if (!q) return item.tab === 'ritmos' ? 0.1 : 0;
  const aliases = ECG_ALIASES[item.id] || [];
  const source = normalizeSearch([
    item.name, item.type, item.explain, item.leads, item.territory, item.intervals,
    ...item.features, ...item.criteria, ...aliases
  ].join(' '));
  if (source.includes(q)) return 10 + q.length / 100;
  const queryTokens = q.split(' ').filter(Boolean);
  const sourceTokens = [...new Set(source.split(' ').filter(Boolean))];
  let total = 0;
  for (const queryToken of queryTokens) {
    const best = sourceTokens.reduce((score, targetToken) => Math.max(score, fuzzyTokenScore(queryToken, targetToken)), 0);
    if (best === 0) return 0;
    total += best;
  }
  return total / queryTokens.length;
}

function compactList(items) {
  return items.filter(Boolean).join(' • ');
}

export function EcgApp() {
  const [tab, setTab] = useState('ritmos');
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!query.trim()) return ECG_PATTERNS.filter((item) => item.tab === tab);
    return ECG_PATTERNS
      .map((item) => ({ item, score: searchScore(item, query) }))
      .filter(({ score }) => score >= 0.58)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
  }, [tab, query]);
  const [selectedId, setSelectedId] = useState('sinus');
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const selected = ECG_PATTERNS.find((item) => item.id === selectedId) || filtered[0] || ECG_PATTERNS[0];

  const report = `SIMMples ECG\nPadrão selecionado: ${selected.name}\nGrupo: ${selected.type}\nDerivações/território: ${selected.leads}\nIntervalos: ${selected.intervals}\nAchados: ${selected.features.join('; ')}\nCritérios: ${selected.criteria.join('; ')}\nInterpretação: ${selected.explain}\nObservação: ${selected.territory}`;

  return (
    <div className="compact-module">
      <Segmented value={tab} onChange={(value) => { setTab(value); setSelectedId(''); }} options={tabs} />
      <Card className="compact-card" title="ECG dinâmico" kicker="Traçados vetoriais gerados no app">
        <div className="search-box"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Busque por nome, sigla, achado ou mesmo com erro de digitação..." /></div>
        <div className="ecg-search-meta">
          <span>{query.trim() ? `${filtered.length} resultado(s) inteligente(s)` : 'Busca por nome, sigla, morfologia, derivação ou território'}</span>
          {query && <button type="button" onClick={() => setQuery('')}>Limpar</button>}
        </div>
        {query.trim() && filtered.length === 0 && <div className="empty-state compact"><Search size={22}/><strong>Nenhum padrão encontrado</strong><span>Tente “TV”, “BAV”, “supra inferior”, “torsade” ou parte do nome.</span></div>}
        <div className="selector-scroll">
          {filtered.map((item) => (
            <button key={item.id} type="button" className={selected.id === item.id ? 'selector-chip active' : 'selector-chip'} onClick={() => { setSelectedId(item.id); setTab(item.tab); }}>
              <span>{item.name}</span><small>{item.type}</small>
            </button>
          ))}
        </div>
        <div className="ecg-control-bar">
          <button type="button" className={paused ? 'ecg-pause-button paused' : 'ecg-pause-button'} onClick={() => setPaused((value) => !value)}>
            {paused ? <Play size={17} /> : <Pause size={17} />}
            {paused ? 'Retomar ECG' : 'Pausar ECG'}
          </button>
          <div className="ecg-speed-control" aria-label="Velocidade da animação">
            {[0.75, 1, 1.25].map((value) => (
              <button key={value} type="button" className={speed === value ? 'active' : ''} onClick={() => setSpeed(value)}>{value}×</button>
            ))}
          </div>
          <span className={paused ? 'ecg-live-dot ecg-live-dot-paused' : 'ecg-live-dot'}>{paused ? 'PAUSADO' : 'AO VIVO'}</span>
        </div>
        <div className="ecg-feature-card ecg-feature-card-rich">
          <div>
            <span className="kicker">{selected.type}</span>
            <h3>{selected.name}</h3>
            <p>{selected.explain}</p>
          </div>
          <HeartPulse size={34} />
        </div>

        <div className="ecg-info-grid">
          <div className="ecg-info-tile"><MapPinned size={16} /><span>Derivações</span><strong>{selected.leads}</strong></div>
          <div className="ecg-info-tile"><Ruler size={16} /><span>Intervalos</span><strong>{selected.intervals}</strong></div>
          <div className="ecg-info-tile"><Waves size={16} /><span>Território/contexto</span><strong>{selected.territory}</strong></div>
          <div className="ecg-info-tile"><ListChecks size={16} /><span>Reconhecimento</span><strong>{compactList(selected.features.slice(0, 4))}</strong></div>
        </div>

        <div className="ecg-pearls-grid">
          <div className="ecg-pearl"><span>Olhe primeiro</span><strong>{(ECG_PEARLS[selected.id] || {}).firstLook || selected.features[0]}</strong></div>
          <div className="ecg-pearl"><span>Armadilha</span><strong>{(ECG_PEARLS[selected.id] || {}).pitfall || 'Sempre correlacionar com clínica, traçados prévios e derivações adicionais.'}</strong></div>
          <div className="ecg-pearl"><span>Pérola prática</span><strong>{(ECG_PEARLS[selected.id] || {}).action || selected.territory}</strong></div>
        </div>

        <EcgStrip title={`DII — ${selected.name}`} helper="Traçado animado em SVG com grade, calibração e intervalos didáticos." pattern={selected.pattern} rhythm={selected.rhythm} rate={selected.rate} lead="II" paused={paused} speed={speed} />
        <EcgTwelveLead pattern={selected.pattern} rhythm={selected.rhythm} rate={selected.rate} paused={paused} speed={speed} />
      </Card>

      <Card className="compact-card" title="Critérios e achados-chave">
        <div className="ecg-criteria-grid">
          {selected.criteria.map((criterion) => <div className="ecg-criterion" key={criterion}>{criterion}</div>)}
        </div>
        <div className="tag-list top-gap">
          {selected.features.map((feature) => <span className="tag" key={feature}>{feature}</span>)}
        </div>
        <div className="notice-box top-gap"><AlertTriangle size={15} /> Curvas são didáticas e dinâmicas para reconhecimento visual. ECG real, calibração, filtros, derivações adicionais, comparação com ECG prévio e contexto clínico continuam obrigatórios.</div>
        <CopyButton text={report}><Activity size={18} /> Copiar resumo ECG</CopyButton>
      </Card>
    </div>
  );
}
