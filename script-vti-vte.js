// ========================================
// VTI/VTE EXAMINATION SYSTEM
// script-vti-vte.js
// ========================================

// ===== GLOBAL VARIABLES =====
var AVSVTIVTE  = [];
var FINSVTIVTE = [];
var FT_VTIVTE  = null;
var FD_VTIVTE  = null;
var currentFinVTIVTEIdx = null;

// ===== CHECKLISTS =====
// Lista de Verificação ANAC F-145-18I ("Lista de Verificação para Realização de
// Vistoria Técnica de Aeronave"), aplicada à VTI (Vistoria Técnica Inicial) e à
// VTE (Vistoria Técnica Especial). Mesma lista para os dois tipos — só 4 itens da
// seção II diferem entre VTI e VTE.
var CL_VTIVTE = (function(){
  var COMMON_SECTIONS = [
  {
    "s": "I – Itens a Serem Verificados Antes da Realização da Vistoria",
    "items": [
      "Vistoria consta do SVA",
      "Impressão da tela do SVA – Dados básicos para preparação da VTI/VTE",
      "Situação de certificação da aeronave regularizada (certificada ou isenta). (RBAC 21.29)",
      "Relatório H.10 (Os Relatórios H.10 deverão ser verificados apenas quando forem referenciados nas Especificações da Aeronave (EA, ER, EP etc). Em caso de dúvida contate o coordenador do projeto através da página da SAR ou, no caso de PCA, obtenha as informações diretamente com a Gerência de Programas de Certificação (GTPR), através do e-mail progcert@anac.gov.br)",
      "Para aeronave interditada ou com algum outro código de suspenso do CA – Parecer favorável da GTVA para a realização da referida vistoria",
      "No caso de PCA, verificar se o tipo de vistoria pode ser realizado conforme limitação prevista no item 5.1 da IS 183-005",
      "Levantamento de todos os formulários e requisitos técnicos e regulamentares necessários para a realização da vistoria. Vide ITD-145-01"
    ]
  },
  {
    "s": "II – Análise Técnica e Documental da Aeronave pelo Servidor Designado ou PCA Antes da Vistoria Física",
    "items": [
      "Licença de Estação de Aeronave - análises necessárias. (ITD-145-01, 7.4/8.4)",
      "Seguro da aeronave (Apólice ou Cert. Indiv + Comp. Pagamento). (Resolução 293 art. 100)",
      "CVA – Análises técnicas/Certificação Oficina/Qualif. Pessoal. (RBAC 91.403 e IS 91.403-001)",
      "Análise do CVA e registros correlatos – (RBAC 91.403 e IS 91.403-001)",
      "Observar o cumprimento do item 6.6.1 da IS 91.403-001 (CA cancelado), se aplicável",
      "Observar o cumprimento do item 6.1.2 da IS 91.403-001 (Apêndice D RBAC 43), se aplicável",
      "Aeronave Avariada: Análises Técnicas/Cert. Oficina/Qualif. Pessoal (Apêndice B IS 43.13-004)",
      "Critérios de preservação da aeronave no período de inatividade. (RBAC 91.403(a))",
      "Diário de Bordo da aeronave – análises necessárias. Resolução 457, de 20 de dezembro de 2017 (Portaria 2.050/SPO/SAR, de 29 de junho de 2018 para diário de bordo em papel, Portaria 3.220/SPO/SAR, de 15 de outubro de 2019, Resolução 458, de 20 de dezembro de 2017 e IS 43.9-004 para registros digitais)",
      "Comprovação do Teste do Transponder, o que inclui teste de integração (RBAC 91.413)",
      "Comprovação do Teste do Altímetro, Sistema de Pressão Estática e Integração (RBAC 91.411)",
      "Comprovação da compensação anual no caso de Bússola Magnética. No caso de Indicador de Direção que Apresente a Proa Magnética de outro tipo, como elétrico, por exemplo, comprovação de cumprimento das tarefas do programa de manutenção. (RBAC 91.409(i), Apêndice “D” do RBAC 43, FAA AC 43.13-1 ou outro normativo aceitável)",
      "Comprovação da verificação do Equipamento de VOR nos últimos 30 (trinta) dias. (RBAC 91.171)",
      "Comprovação do Teste em Voo da aeronave nos últimos 60 (sessenta) dias. (ITD-145-01)",
      "Caderneta de Célula – Análises necessárias para aeronaves RBAC 91 e RBAC 135 (IS 43.9-003); Aeronaves RBAC 121 ou 135, conforme aplicável, registros primários de toda a manutenção da aeronave (RBAC 121.380)",
      {"n":"Caderneta de Motor – Análises necessárias para aeronaves RBAC 91 e RBAC 135 (IS 43.9-003); aeronaves RBAC 121, registros primários de toda a manutenção do Motor (RBAC 121.380)","type":"multi","cols":["1","2","3","4"]},
      {"n":"Caderneta de Hélice – Análises necessárias para aeronaves RBAC 91 e RBAC 135 (IS 43.9-003); aeronaves RBAC 121, registros primários de toda a manutenção da Hélice (RBAC 121.380)","type":"multi","cols":["1","2","3","4"]},
      "Manual de Voo e/ou Manual de Operação da aeronave – atualizações e análises necessárias. (RBAC 91.9)",
      "Check List da aeronave – atualizações e análises necessárias. (RBAC 91.503)",
      "Cumprimento das DAs da aeronave. (RBAC 91.417(a)(2)(v), RBAC 121.380 e 135.439)",
      {"n":"Cumprimento das DAs do(s) motor(es). (RBAC 91.417(a)(2)(v), RBAC 121.380 e 135.439)","type":"multi","cols":["1","2","3","4"]},
      {"n":"Cumprimento das DAs da(s) hélice(s). (RBAC 91.417(a)(2)(v), RBAC 121.380 e 135.439)","type":"multi","cols":["1","2","3","4"]},
      "Cumprimento das DAs de componentes. (RBAC 91.417(a)(2)(v), RBAC 121.380 e 135.439)",
      "Cumprimento das DAs da APU. (RBAC 91.417(a)(2)(v), RBAC 121.380 e 135.439)",
      "Análise do cumprimento dos requisitos do Relatório H.10, se aplicável. (RBAC 21.29)",
      "Análise do Manual de Voo e/ou Manual de Operação da aeronave em relação ao H.10, se aplicável. (RBAC 91.9)",
      "Análise do cumprimento dos requisitos da EA, ER ou TCDS da aeronave, EM ou TCDS do(s) motor(es) e EH ou TCDS da(s) hélice(s), conforme aplicável. (RBAC 21.183)",
      "Análise do Programa de Manutenção da aeronave. (RBAC 91.409, RBAC 135.411/421 e 121.367)",
      {"n":"Análise do Programa de Manutenção do(s) motor(es) e hélice(s). (RBAC 91.409, RBAC 135.411/421 e 121.367)","type":"multi","cols":["1","2","3","4"]},
      "Análise dos componentes com vida limite / controlados da aeronave e rastreabilidade. (RBAC 91.417(a)(2)(ii) RBAC 135.411/421 e 121.367)",
      {"n":"Análise dos componentes com vida limite / controlados do(s) motor(es) e hélice(s) e rastreabilidade. (RBAC 91.417(a)(2)(ii), RBAC 135.411/421 e 121.367)","type":"multi","cols":["1","2","3","4"]},
      "Análise dos programas especiais de manutenção (CPCP, SID, AGING, EWIS, MORE), conforme aplicável. (RBAC 91.409, RBAC 135.411 e 121.367)",
      "Análise dos Itens de Inspeção Especial da aeronave. (RBAC 91.409, RBAC 135.411 e 121.367)",
      {"n":"Análise dos Itens de Inspeção Especial do(s) motor(es) e hélice(s). (RBAC 91.409, RBAC 135.411 e 121.367)","type":"multi","cols":["1","2","3","4"]},
      "ELT – fixado ao avião – registro de instalação. (RBAC 91.207)",
      "ELT – inspeção a cada 12 meses e validade da bateria. (RBAC 91.207(c) e (d))",
      "RUÍDO – Análise das condições operacionais de ruído (Subparte I RBAC 91) Para operações internacionais conforme RBAC 121, consistência das informações do AFM com as informações definidas no item 5.2(b) do MPR 280, exceto quanto às informações contidas no Certificado de Aeronavegabilidade",
      "MEL – analisar, quando aplicável. (RBAC 91.213)",
      "ACR – itens com Ação Corretiva Retardada, analisar, quando aplicável. (RBAC 91.213(a)(4))",
      "Manual e Ficha de Peso e Balanceamento – analisar. (RBAC 91.423 / ITD-145-01)",
      "Planta baixa da configuração da aeronave – analisar. (RBAC 91.423 / ITD-145-01)",
      "PESAGEM aeronaves RBAC 121 – Aeronave com MGM aceito, de acordo com o período estabelecido no referido Manual. (RBAC 121.135(b)(21))",
      "PESAGEM aeronaves RBAC 91 – Aeronaves cujos manuais aprovados definem intervalos de tempo entre pesagens consecutivas devem ser pesadas de acordo com tais manuais; demais categorias sem intervalo definido devem ser repesadas a cada 5 anos, executada por pessoa autorizada para o serviço. (RBAC 91.423)",
      "PESAGEM aeronaves RBAC 135 – A cada 36 meses, executada por pessoa autorizada para o serviço, salvo exceções previstas em 135.185(a)(b). (RBAC 91.423 / 135.185)",
      "REPESAGEM 91 e 135 – sempre que houver dúvidas quanto à exatidão do peso e balanceamento, ou após serviços de manutenção/alterações que possam ter alterado o peso (pintura geral, grandes reparos, grandes alterações, mudanças de configuração etc.). (RBAC 91.423(c))",
      "REPESAGEM 121 – Conforme critérios estabelecidos no manual. (RBAC 121.135(b)(21))",
      "RECÁLCULO DE PESAGEM 91 e 135 – sempre que a aeronave sofrer alteração por remoção, instalação ou mudança de posição de equipamentos, acessórios, decoração interna etc. (RBAC 91.423(d))",
      "RECÁLCULO DE PESAGEM 121 – Conforme critérios estabelecidos no manual. (RBAC 121.135(b)(21))",
      "Verificar e analisar as grandes alterações e os grandes reparos da célula, motores, hélices, rotores e equipamentos incorporados à aeronave. (91.403; 43.7; 43.9; IS 20-001; IS 21-010)",
      "Para aeronaves RBAC 135 (135.169) – Verificar os Requisitos Adicionais de Aeronavegabilidade",
      "Para aeronaves RBAC 135 (135.170) – Materiais para compartimentos interiores",
      "REQUISITOS DE CO-PILOTO, para análise quando aplicável. (RBAC 91.531)",
      "Verificação das aprovações de retorno ao serviço “maintenance release” dos últimos checks da aeronave. (RBAC 91.417(a)(1), RBAC 135.437 e 121.379 e RBAC 43.7)",
      "Lista de grandes alterações e grandes reparos incorporados na aeronave, motor(es) e hélice(s). (RBAC 91.403 (a), 91.417(a)(2)(vi), RBAC 135.439, 121.380 e ITD-145-01)",
      "Materiais para compartimentos interiores – para avião que atenda a uma emenda do CT ou CST emitido segundo o ‘SFAR 41’ para aeronaves com PMD acima de 5.670kg, prazo de 1 ano após a emissão do 1º CA, para cumprir os requisitos de interior, conforme RBAC 25",
      "Para aeronaves RBAC 121 (121.1107(a)) / RBAC 91 (91.1505) – Avaliação de reparos em fuselagens pressurizadas",
      "Para aeronaves RBAC 121 (121.1113) / RBAC 91 (91.1507) – Programa de inspeções do sistema de tanques de combustível",
      "Aeronaves RBAC 121 recém-produzidas para a qual o Estado do fabricante tenha emitido certificado de aeronavegabilidade ou certificado de aeronavegabilidade para exportação após 05 de junho de 2011 – Verificar se existem Meios de Mitigação de Ignição (IMM) ou Meios de Redução de Inflamabilidade (FRM) que atendam aos requisitos da seção 26.33 do RBAC 26 conforme requerido pelo item (b) e tabela 1 do RBAC 121.1117",
      "Para aeronaves RBAC 121 (121.314) – Compartimentos de carga e bagagem",
      "Para aeronaves RBAC 121 (121.215/312 e 311) – Materiais para compartimentos interiores, assentos e cintos",
      "Para aeronaves RBAC 121 (121.325) – Instrumentos e Equipamentos para operação IFR",
      "Para aeronaves RBAC 121 (121.333) – Oxigênio Suplementar para descidas em emergência e primeiros socorros",
      "Para aeronaves RBAC 121 (121.335) – Padrão dos equipamentos de oxigênio",
      "Verificar aplicabilidade e requisitos para Conjuntos de Primeiros Socorros, Médico e Precaução Universal. (RBAC 91.231(e), RBAC 121.309 e Apêndice A ou 135.176 e 135.177)",
      "Verificar aplicabilidade e requisitos de FDR / DFDR (parâmetros) (RBAC 91.609, RBAC 121.343/344/344a ou 135.152/152a)",
      "Verificar aplicabilidade e requisitos de CVR (RBAC 91.609, RBAC 121.359 e 135.151)",
      "Verificar aplicabilidade e requisitos de sistema de percepção e alarme de proximidade do solo (RBAC 91.223, RBAC 121.354 e 135.154)",
      "Verificar aplicabilidade e requisitos de ACAS / TCAS (RBAC 91.221, RBAC 121.356 e 135.180)",
      "Verificar requisitos para operações em espaço aéreo RVSM (RBAC 91)",
      "Para aeronaves com motores P&WC no programa MORE, verificar o correto cumprimento com o programa (avaliação das inspeções realizadas por organização qualificada/certificada, envio dos resultados à detentora do CST, e consistência dos registros de voo com o Diário de Bordo, conforme o padrão do programa MORE)",
      "Documentos a serem arquivados (ITD-145-01 itens 7.9 (VTI) e 8.9 (VTE))",
      "Documentos a serem exigidos (ITD-145-01 itens 7.3 (VTI) e 8.3 (VTE))"
    ]
  },
  {
    "s": "III – Vistoria Física — Marcas e Identificação",
    "items": [
      "Verificar as pinturas e o tamanho das marcas brasileiras. (RBAC 45.23-I e 45.29-I)",
      "Verificar a plaqueta de identificação da aeronave. (RBAC 45.11)",
      "Verificar a plaqueta de aço inox com as marcas brasileiras (próxima à plaqueta de identificação da aeronave). (RBAC 45.30-I)",
      "Para aeronaves operando segundo o RBAC 135 (combinada ou não com outra operação) e constantes das Especificações Operativas de empresa aérea certificada segundo o RBAC 135 – verificar a inscrição “TRANSPORTE PÚBLICO” próximo à porta principal de entrada de passageiros da aeronave. (RBAC 45.12-I(a))",
      "Para aeronaves operadas ou a serem operadas como SAE – verificar a inscrição “SAE” próximo à porta principal de entrada de passageiros da aeronave. (RBAC 45.12-I(b))",
      "Para aeronaves utilizadas ou a serem utilizadas para INSTRUÇÃO – verificar a inscrição “INSTRUÇÃO” próximo à porta principal de entrada de passageiros da aeronave. (RBAC 45.12-I(d))",
      "Para aeronaves utilizadas ou a serem utilizadas em VOO PANORÂMICO, conforme RBAC 136 – verificar a inscrição “VOO PANORÂMICO” próximo à porta principal de entrada de passageiros da aeronave. (RBAC 45.12-I(c))",
      "Para as demais aeronaves – verificar que NÃO pode haver qualquer inscrição que se assemelhe ou se confundam com aquelas previstas nos parágrafos (a), (b), (c) e (d) do RBAC 45.12-I. (RBAC 45.12-I(f))",
      "Para aeronaves RBAC 121, 135 e 137 – verificar a inscrição do nome comercial do detentor de certificado na aeronave (RBAC 119.9 (b) e RBAC 137.9 (b))",
      "Verificar a correta identificação do número de série (N/S) e do modelo da aeronave. (RBAC 45.13)",
      {"n":"Verificar a correta identificação do número de série (N/S) e do modelo do(s) motor(es) e hélice(s). (RBAC 45.13)","type":"multi","cols":["1","2","3","4"]},
      "Verificar a identificação de chamada (marcas) frontal ao 1P/2P. (ICA 100-12)"
    ]
  },
  {
    "s": "III – Vistoria Física — Instrumentos e Equipamentos",
    "items": [
      "Verificar os requisitos do relatório H.10, se aplicável. (RBAC 21.29)",
      "Verificar o cumprimento dos requisitos de instrumentos e equipamentos de acordo com o tipo de operação da aeronave (RBAC 91.205)",
      "Verificar a instalação dos placares de acordo com Manual de Voo e/ou Relatório H.10, conforme aplicável. (RBAC 21.41-I)",
      "Oxigênio Suplementar – verificar os equipamentos. (RBAC 91.211)",
      "Aviso de “use cintos” e “não fume” – aeronave transportando passageiros. (RBAC 91.517, RBAC 135.127 e 121.317)",
      "Cintos de ombro/segurança - cabine dos pilotos e assentos de comissários. (RBAC 91.521, RBAC 135.128, 135.171 e 121.311)",
      "Verificar se os números de série dos componentes controlados, constantes na documentação da aeronave, correspondem ao realmente instalado na aeronave. (ITD-145-01)",
      "Verificar se o avião cumpre com os requisitos de materiais de interior. (RBAC 91.613, RBAC 135.170 e 121.312)",
      "Verificar instalação do CVR e constatar a validade da bateria do localizador. (RBAC 91.609)",
      "Verificar instalação do FDR e constatar a validade da bateria do localizador. (RBAC 91.609)",
      "Verificar a instalação do ELT e constatar a data de validade da bateria (obs: a data deverá estar marcada na parte exterior). (RBAC 91.207)",
      "Aeronaves RBAC 121 – Verificar relatório técnico previsto na Resolução nº 135/2010 da ANAC quanto ao Programa de Avaliação Dimensional e a existência da etiqueta e/ou selo ANAC",
      "Aeronaves RBAC 135 e 121 - Verificar o cumprimento da Resolução n° 280/2013 da ANAC (acessibilidade de passageiros), se aplicável"
    ]
  },
  {
    "s": "Grupo da Fuselagem",
    "items": [
      "Entelamento/revestimento quanto ao estado geral",
      "Componentes quanto a defeitos aparentes",
      "Garrafas de gás/tanques de lastro quanto a más condições",
      "Objetos soltos que possam emperrar controles",
      "Poltronas/cintos de segurança quanto a más condições",
      "Janelas/pára-brisas quanto a quebras e deterioração",
      "Instrumentos quanto a más condições/marcações impróprias",
      "Controles de voo e do motor quanto a condições gerais",
      "Bateria quanto à carga adequada",
      "Todos os componentes quanto a más condições"
    ]
  },
  {
    "s": "Grupo Motopropulsor",
    "multiCols": ["1","2","3","4"],
    "items": [
      "Área do(s) motor(es) quanto a vazamentos (óleo/combustível)",
      "Berço do(s) motor(es) quanto a trincas e folgas de fixação",
      "Amortecedores flexíveis do(s) motor(es) – condições gerais",
      "Controles do(s) motor(es) quanto a defeitos em geral",
      "Tubulações/mangueiras do(s) motor(es) quanto a vazamentos",
      "Conjuntos de escapamentos quanto a trincas e defeitos",
      "Acessórios do(s) motor(es) quanto a defeitos aparentes",
      "Capotas/Carenagens do(s) motor(es) – defeitos aparentes"
    ]
  },
  {
    "s": "Grupo do Trem de Pouso",
    "multiCols": ["Aux.","E","D"],
    "items": [
      "Todas as unidades quanto a más condições e insegurança",
      "Verificação do nível adequado de óleo dos amortecedores",
      "Articulações e montantes quanto ao estado geral",
      "Mecanismo de recolhimento e travamento quanto ao estado geral",
      "Linhas hidráulicas quanto a vazamentos (atuação do TDP e freio)",
      "Rodas quanto a trincas e defeitos",
      "Fiações elétricas quanto a condições impróprias e atritos",
      "Pneus quanto a desgastes e cortes (marcações para pneus com câmara)",
      "Freios quanto ao estado geral aparente",
      "Flutuadores e skis quanto ao estado geral"
    ]
  },
  {
    "s": "Grupo das Asas e Seção Central",
    "multiCols": ["E","D"],
    "items": [
      "Componentes quanto ao estado geral",
      "Entelamento/revestimento quanto ao estado geral",
      "Superfícies de comando quanto ao estado geral"
    ]
  },
  {
    "s": "Grupo da Empenagem",
    "items": [
      "Componentes quanto ao estado geral",
      "Entelamento/revestimento quanto ao estado geral",
      "Superfícies de comando quanto ao estado geral"
    ]
  },
  {
    "s": "Grupo da Hélice",
    "multiCols": ["1","2","3","4"],
    "items": [
      "Conjunto da(s) hélice(s) quanto a trinca e vazamentos",
      "Parafusos de fixação quanto ao estado geral e frenagem",
      "Dispositivos anti-gelo quanto ao estado geral",
      "Mecanismos de controles quanto ao estado geral"
    ]
  },
  {
    "s": "Grupo de Rádio-Comunicação",
    "items": [
      "Equipamentos rádio quanto à instalação e estado geral",
      "Fiações e conduítes quanto ao estado geral",
      "Metalizações e blindagens quanto ao estado geral",
      "Antenas quanto ao estado geral"
    ]
  },
  {
    "s": "IV – Check Operacional da Aeronave",
    "items": [
      "Verificar alarme de estol. (ITD-145-01)",
      "Verificar painel de alarmes. (ITD-145-01)",
      "Verificar o funcionamento da barra de emergência. (ITD-145-01)",
      "Verificar a carga da bateria interna. (ITD-145-01)",
      "Verificar o indicador de temperatura do ar exterior. (ITD-145-01)",
      "Verificar a funcionalidade dos sistemas de comunicação e de navegação (se aplicável) quanto à clareza, indicação, sensibilidade e precisão. (ITD-145-01)",
      "Verificar o sistema de intercomunicação e Public Address. (ITD-145-01)",
      "Verificar se as marcações dos instrumentos e equipamentos instalados estão de acordo com as limitações previstas no Manual de Voo da aeronave. (ITD-145-01)",
      "Check operacional do Grupo Motopropulsor e equipamentos constantes do Laudo de Vistoria conforme necessidade e viabilidade. (ITD-145-01)"
    ]
  },
  {
    "s": "Elaboração do Resumo Final das Não Conformidades",
    "items": [
      {"n": "Situação de Aeronavegabilidade", "type": "airworthy"}
    ]
  }
];

  var VTI_ONLY_ITEMS = [
  "Comprovação de desregistro da aeronave – VTI. (Resolução 293, art. 77)",
  "Certificado de Aeronavegabilidade para Exportação – VTI. (RBAC 21.183 (c))"
];
  var VTE_ONLY_ITEMS = [
  "Certificado de Nacionalidade/Matrícula – análises necessárias – VTE. (RBAC 91.203)",
  "Certificado de Aeronavegabilidade – análises necessárias – VTE. (RBAC 91.203)"
];

  var MODELS = ["EMB-505 - Phenom 300", "Falcon 900EX", "Hawker 400A", "C750 - Citation X", "C525 - CJ1", "C525B - CJ3", "Gulfstream G280", "Other"];

  function buildSections(extraDocItems){
    var sections = JSON.parse(JSON.stringify(COMMON_SECTIONS));
    sections[1].items = extraDocItems.concat(sections[1].items);
    return sections;
  }

  var vti = {}, vte = {};
  MODELS.forEach(function(m){
    vti[m] = buildSections(VTI_ONLY_ITEMS);
    vte[m] = buildSections(VTE_ONLY_ITEMS);
  });

  return { VTI: vti, VTE: vte };
})();

// Bump this whenever the default CL_VTIVTE content changes so that stale
// per-browser admin overrides (saved before the change) get discarded
// instead of silently shadowing the new default forever.
var CL_VTIVTE_TPL_VERSION = 'anac-f145-18i-pt-v3';

// Load any admin-saved VTI/VTE template overrides
(function(){
  try{
    var _vc=localStorage.getItem('tb7_cl_vtivte_custom');
    if(_vc && localStorage.getItem('tb7_cl_vtivte_custom_v')!==CL_VTIVTE_TPL_VERSION){
      localStorage.removeItem('tb7_cl_vtivte_custom');
      _vc=null;
    }
    if(_vc){
      var _vcp=JSON.parse(_vc);
      ['VTI','VTE'].forEach(function(t){
        if(_vcp[t])Object.keys(_vcp[t]).forEach(function(m){CL_VTIVTE[t][m]=_vcp[t][m];});
      });
    }
  }catch(e){}
})();

// ===== LOAD / SAVE =====
function loadVTIVTE(){
  try{ var s=localStorage.getItem('AVSVTIVTE');  if(s) AVSVTIVTE=JSON.parse(s);  }catch(e){ AVSVTIVTE=[];  }
  try{ var f=localStorage.getItem('FINSVTIVTE'); if(f) FINSVTIVTE=JSON.parse(f); }catch(e){ FINSVTIVTE=[]; }
}

function saveVTIVTE(){
  try{
    localStorage.setItem('AVSVTIVTE',  JSON.stringify(AVSVTIVTE));
    localStorage.setItem('FINSVTIVTE', JSON.stringify(FINSVTIVTE));
  }catch(e){ console.error('Error saving VTI/VTE:', e); }
  if(typeof cloudSave==='function') cloudSave();
}

// ===== ADD INSPECTION =====
function addVTIVTE(){
  var mat   = document.getElementById('fvtivte-mat')   ? document.getElementById('fvtivte-mat').value.toUpperCase().trim() : '';
  var type  = document.getElementById('fvtivte-type')  ? document.getElementById('fvtivte-type').value  : '';
  var mod   = document.getElementById('fvtivte-mod')   ? document.getElementById('fvtivte-mod').value   : '';
  var serie = document.getElementById('fvtivte-serie') ? document.getElementById('fvtivte-serie').value.trim() : '';
  var resp  = document.getElementById('fvtivte-resp')  ? document.getElementById('fvtivte-resp').value  : '';

  if(!mat||!type||!mod||!serie||!resp){ _showToast('Preencha todos os campos obrigatórios','warn'); return; }

  var tpl = (CL_VTIVTE[type] && (CL_VTIVTE[type][mod] || CL_VTIVTE[type]['Other'])) || [];
  var cl  = tpl.map(function(sec){
    return { s:sec.s, multiCols:sec.multiCols||null, items:sec.items.map(function(tIt){
      var iN=typeof tIt==='string'?tIt:tIt.n;
      var iCols=typeof tIt==='object'&&tIt.cols?tIt.cols:null;
      var iT=typeof tIt==='object'&&tIt.type?tIt.type:'standard';
      var cols=sec.multiCols||iCols;
      var stInit=cols?cols.map(function(){return '--';}):'--';
      return {n:iN,type:iT,cols:iCols,st:stInit,by:'',dt:'',obs:'',fotos:[]};
    })};
  });

  AVSVTIVTE.push({id:Date.now(),type:type,mat:mat,mod:mod,serie:serie,resp:resp,dc:dh(),cl:cl});
  if(typeof logActivity==='function')logActivity('add_vtivte',mat+' ('+type+' '+mod+')');
  saveVTIVTE();
  renderVTIVTE();

  ['fvtivte-mat','fvtivte-type','fvtivte-mod','fvtivte-serie','fvtivte-resp'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.value='';
  });
  _showToast('✅ Vistoria adicionada!','ok');
}

/// ===== SET STATUS  (standardised values: 'ok' | 'na' | 'ft' | 'df' | '--') =====
function setStVTIVTE(idx, si, ii, st){
  if(!AVSVTIVTE[idx] || !AVSVTIVTE[idx].cl[si] || !AVSVTIVTE[idx].cl[si].items[ii]){
    console.error('setStVTIVTE: invalid indices', {idx,si,ii}); return;
  }
  st = st.toLowerCase();
  var it = AVSVTIVTE[idx].cl[si].items[ii];
  if(it.st===st){ it.st='--'; it.by=''; it.dt=''; }
  else          { it.st=st;  it.by=ME?ME.nome:'Unknown'; it.dt=dh(); }
  saveVTIVTE();
  renderVTIVTE();
  if(it.st&&it.st!=='--')_scrollToNextVTIVTE(idx,si,ii);
}

// ===== STATUS PICKER POPOVER (tap the LEG badge in the compact table) =====
// Shows OK/NA/FT/DF options right beside the tapped badge — no page jump,
// no auto-scroll, no cycling through states blindly.
function openVtiStPopover(idx,si,ii,ci,anchorEl){
  var pop=document.getElementById('vti-st-popover');
  if(!pop){
    pop=document.createElement('div');
    pop.id='vti-st-popover';
    pop.className='vti-status-popover';
    document.body.appendChild(pop);
  }
  var ciArg=(ci===null||ci===undefined)?'null':ci;
  pop.innerHTML=
    '<button class="vti-pop-btn st-ok" onclick="_pickVtiSt('+idx+','+si+','+ii+','+ciArg+',\'ok\')">OK</button>'+
    '<button class="vti-pop-btn st-na" onclick="_pickVtiSt('+idx+','+si+','+ii+','+ciArg+',\'na\')">NA</button>'+
    '<button class="vti-pop-btn st-ft" onclick="_pickVtiSt('+idx+','+si+','+ii+','+ciArg+',\'ft\')">FT</button>'+
    '<button class="vti-pop-btn st-df" onclick="_pickVtiSt('+idx+','+si+','+ii+','+ciArg+',\'df\')">DF</button>'+
    '<button class="vti-pop-btn st-clear" onclick="_pickVtiSt('+idx+','+si+','+ii+','+ciArg+',\'--\')" title="Limpar">✕</button>';
  pop.classList.add('open');

  var r=anchorEl.getBoundingClientRect();
  var popW=pop.offsetWidth||220, popH=pop.offsetHeight||36;
  var left=r.right+8;
  if(left+popW>window.innerWidth-4) left=r.left-popW-8;
  if(left<4) left=Math.max(4,window.innerWidth-popW-4);
  var top=r.top+window.scrollY-(popH/2)+(r.height/2);
  top=Math.max(4+window.scrollY,top);
  pop.style.left=left+'px';
  pop.style.top=top+'px';
}

function _pickVtiSt(idx,si,ii,ci,st){
  if(!AVSVTIVTE[idx]||!AVSVTIVTE[idx].cl[si]||!AVSVTIVTE[idx].cl[si].items[ii])return;
  var it=AVSVTIVTE[idx].cl[si].items[ii];
  if(ci===null||ci===undefined){
    if(st==='--'){ it.st='--'; it.by=''; it.dt=''; }
    else         { it.st=st;  it.by=ME?ME.nome:'Unknown'; it.dt=dh(); }
  } else {
    if(!Array.isArray(it.st))return;
    it.st[ci]=st;
    if(st==='--'){ it.by=''; it.dt=''; }
    else         { it.by=ME?ME.nome:'Unknown'; it.dt=dh(); }
  }
  closeVtiStPopover();
  saveVTIVTE();
  renderVTIVTE();
}

function closeVtiStPopover(){
  var pop=document.getElementById('vti-st-popover');
  if(pop) pop.classList.remove('open');
}

document.addEventListener('click', function(e){
  var pop=document.getElementById('vti-st-popover');
  if(!pop||!pop.classList.contains('open'))return;
  if(pop.contains(e.target)||e.target.classList.contains('vti-leg'))return;
  pop.classList.remove('open');
});

// ===== EXPAND/COLLAPSE A COMPACT-TABLE ROW =====
// Tracked outside the DOM so re-renders (status pick, photo add/remove
// anywhere in the list) don't snap already-open rows shut.
var _vtiExpandedRows={};
function _toggleVtiRow(detailId,rowMainEl){
  var el=document.getElementById(detailId);
  if(!el)return;
  var open=el.style.display==='block';
  el.style.display=open?'none':'block';
  _vtiExpandedRows[detailId]=!open;
  var icon=rowMainEl?rowMainEl.querySelector('.vti-expand-icon'):null;
  if(icon)icon.textContent=open?'▸':'▾';
}

function _scrollToNextVTIVTE(idx,si,ii){
  var av=AVSVTIVTE[idx];if(!av)return;
  for(var s=si;s<av.cl.length;s++){
    var start=(s===si)?ii+1:0;
    for(var i=start;i<av.cl[s].items.length;i++){
      var it=av.cl[s].items[i];
      var isUnanswered=Array.isArray(it.st)
        ? it.st.some(function(cst){return cst===''||cst==='--'||cst===undefined;})
        : (it.st===''||it.st==='--'||it.st===undefined);
      if(isUnanswered){
        (function(ts,ti){
          setTimeout(function(){
            var el=document.getElementById('vitem-'+idx+'-'+ts+'-'+ti);
            if(el)el.scrollIntoView({behavior:'smooth',block:'center'});
          },60);
        })(s,i);
        return;
      }
    }
  }
}

// ===== SAVE OBSERVATION =====
function saveObsVTIVTE(idx, si, ii, obs){
  if(AVSVTIVTE[idx] && AVSVTIVTE[idx].cl[si] && AVSVTIVTE[idx].cl[si].items[ii]){
    AVSVTIVTE[idx].cl[si].items[ii].obs=obs;
    saveVTIVTE();
  }
}

// ===== OPEN PHOTO MODAL =====
function abrirModFotoVTIVTE(idx, si, ii){
  if(!AVSVTIVTE[idx] || !AVSVTIVTE[idx].cl[si] || !AVSVTIVTE[idx].cl[si].items[ii]){
    _showToast('❌ Item não encontrado','error'); return;
  }
  var modal=document.getElementById('mod-foto');
  if(!modal){ _showToast('❌ Modal não encontrado','error'); return; }

  FT_VTIVTE={idx:idx,si:si,ii:ii};
  FD_VTIVTE=[idx,si,ii];

  if(typeof _resetFotoModal==='function') _resetFotoModal();
  mostrarBotaoCorreto('vtivte');
  document.getElementById('mod-foto-label').textContent=AVSVTIVTE[idx].cl[si].items[ii].n;
  modal.style.display='flex';
}

// ===== SAVE PHOTO =====
function salvarFotoVTIVTE(){
  var prevImg = document.getElementById('prev-img');
  if(!prevImg){ _showToast('❌ Elementos de foto não encontrados','error'); return; }

  var imgData = prevImg.src;
  if(!imgData||imgData.length<100){ _showToast('❌ Nenhuma foto selecionada','warn'); return; }
  if(!FT_VTIVTE||!FD_VTIVTE){ _showToast('❌ Contexto de foto inválido','error'); return; }

  var idx=FD_VTIVTE[0], si=FD_VTIVTE[1], ii=FD_VTIVTE[2];
  if(!AVSVTIVTE[idx]||!AVSVTIVTE[idx].cl[si]||!AVSVTIVTE[idx].cl[si].items[ii]){
    _showToast('❌ Item não encontrado','error'); return;
  }

  var item=AVSVTIVTE[idx].cl[si].items[ii];
  if(!item.fotos) item.fotos=[];
  if(item.fotos.some(function(f){ return f.d===imgData; })){ _showToast('⚠️ Foto já existe','warn'); return; }

  item.fotos.push({d:imgData, by:ME?ME.nome:'Unknown', dt:dh()});
  saveVTIVTE();
  FT_VTIVTE=null; FD_VTIVTE=null;
  renderVTIVTE();
  fecharModFoto();
  _showToast('✅ Foto salva!','ok');
}

// ===== REMOVE PHOTO =====
function rmFotoVTIVTE(idx, si, ii, fi){
  if(!AVSVTIVTE[idx]||!AVSVTIVTE[idx].cl[si]||!AVSVTIVTE[idx].cl[si].items[ii]) return;
  var fotos=AVSVTIVTE[idx].cl[si].items[ii].fotos;
  if(!Array.isArray(fotos)) return;
  fotos.splice(fi,1);
  saveVTIVTE();
  renderVTIVTE();
  _showToast('✅ Foto removida','ok');
}

// ===== STATUS CALCULATION =====
// ===== LEGENDA ANAC F-145-18I =====
// FT – FALTANDO (não apresentado o comprovante de cumprimento)
// NA – NÃO APLICÁVEL (não aplicável ao tipo de vistoria ou aeronave, motor ou hélice)
// OK – SATISFATÓRIO (atende aos requisitos regulamentares, operacionais ou de manutenção)
// DF – DEFICIENTE (item verificado, porém não atende aos requisitos regulamentares, operacionais ou de manutenção)
function sgResVTIVTE(cl){
  var all=[];
  for(var s=0;s<cl.length;s++)
    for(var i=0;i<cl[s].items.length;i++){
      var st=cl[s].items[i].st;
      if(Array.isArray(st)) all=all.concat(st); else all.push(st);
    }
  if(all.indexOf('df')>-1||all.indexOf('naoaero')>-1) return 'danger';
  if(all.indexOf('ft')>-1) return 'warn';
  if(all.indexOf('--')>-1) return 'neutral';
  return 'ok';
}

// ===== FORMAT A SINGLE OR MULTI-COLUMN STATUS FOR DISPLAY =====
function _vtiSingleLbl(st){
  return st==='ok'?'OK':st==='na'?'NA':st==='ft'?'FT':st==='df'?'DF':st==='aero'?'AERONAVEGÁVEL':st==='naoaero'?'NÃO-AERONAVEGÁVEL':'Pendente';
}
function _vtiSingleCls(st){
  return st==='ok'?'ok':st==='na'?'na':st==='ft'?'warn':st==='df'?'danger':st==='aero'?'ok':st==='naoaero'?'danger':'pending';
}
function _vtiStDisplay(st){
  if(!Array.isArray(st)) return {cls:_vtiSingleCls(st), lbl:_vtiSingleLbl(st)};
  var hasDf=false,hasFt=false,hasPending=false,hasOk=false,hasNa=false;
  st.forEach(function(s){
    if(s==='df')hasDf=true;
    else if(s==='ft')hasFt=true;
    else if(s==='ok')hasOk=true;
    else if(s==='na')hasNa=true;
    else hasPending=true; // '--', '', undefined
  });
  var cls=hasDf?'danger':hasFt?'warn':hasPending?'pending':(hasNa&&!hasOk)?'na':'ok';
  var lbl=st.map(function(s){return (s&&s!=='--')?s.toUpperCase():'—';}).join(' / ');
  return {cls:cls, lbl:lbl};
}

// ===== RENDER ACTIVE VTI/VTE =====
function renderVTIVTE(){
  var filtro = document.getElementById('busca-vtivte') ? document.getElementById('busca-vtivte').value.toLowerCase() : '';
  var lista  = document.getElementById('lista-vtivte');
  if(!lista) return;
  lista.innerHTML='';

  var found=[];
  for(var a=0;a<AVSVTIVTE.length;a++){
    var sr=AVSVTIVTE[a];
    if(sr.mat.toLowerCase().indexOf(filtro)>-1 || sr.type.toLowerCase().indexOf(filtro)>-1 ||
       (sr.mod&&sr.mod.toLowerCase().indexOf(filtro)>-1)) found.push(a);
  }
  if(!found.length){ lista.innerHTML='<p class="empty">Nenhuma vistoria VTI/VTE encontrada.</p>'; return; }

  for(var fi=0;fi<found.length;fi++){
    var idx=found[fi];
    var sr=AVSVTIVTE[idx];
    var res=sgResVTIVTE(sr.cl);
    var bCls,bLbl;
    if(res==='ok')         { bCls='ok';      bLbl='✓ SATISFATÓRIO'; }
    else if(res==='warn')  { bCls='warn';    bLbl='FT FALTANDO'; }
    else if(res==='danger'){ bCls='danger';  bLbl='✕ DEFICIENTE'; }
    else                   { bCls='neutral'; bLbl='PENDENTE'; }

    // ── Section jump bar ───────────────────────────
    var jumpBar='<div class="sec-jump-bar">';
    for(var sj=0;sj<sr.cl.length;sj++){
      jumpBar+='<button class="sec-jump-pill" onclick="document.getElementById(\'vsec-'+idx+'-'+sj+'\').scrollIntoView({behavior:\'smooth\',block:\'start\'})">'+('S'+(sj+1)+' '+sr.cl[sj].s).substring(0,18)+'</button>';
    }
    jumpBar+='</div>';

    var clH='';
    for(var s=0;s<sr.cl.length;s++){
      var sec=sr.cl[s];
      clH+='<div class="vti-table" id="vsec-'+idx+'-'+s+'">';
      clH+='<div class="vti-sec-title">'+sec.s+'</div>';
      for(var i=0;i<sec.items.length;i++){
        var it=sec.items[i];

        if(it.type==='airworthy'){
          var isAero=it.st==='aero', isNao=it.st==='naoaero';
          clH+='<div class="airworthy-row" id="vitem-'+idx+'-'+s+'-'+i+'">';
          clH+='<button class="airworthy-btn'+(isAero?' active-aero':'')+'" onclick="setStVTIVTE('+idx+','+s+','+i+',\'aero\')">'+(isAero?'☒':'☐')+' AERONAVEGÁVEL</button>';
          clH+='<button class="airworthy-btn'+(isNao?' active-naoaero':'')+'" onclick="setStVTIVTE('+idx+','+s+','+i+',\'naoaero\')">'+(isNao?'☒':'☐')+' NÃO-AERONAVEGÁVEL</button>';
          clH+='</div>';
          continue;
        }

        var isMulti=Array.isArray(it.st);
        var obsVal=it.obs?it.obs.replace(/"/g,'&quot;'):'';
        if(!it.fotos)it.fotos=[];
        var detailId='vdet-'+idx+'-'+s+'-'+i;

        var indicators='';
        if(it.obs&&it.obs.trim())indicators+='<span class="vti-ind" title="Tem observação">📝</span>';
        if(it.fotos.length)indicators+='<span class="vti-ind" title="'+it.fotos.length+' foto(s)">📷'+it.fotos.length+'</span>';

        var legHtml='';
        if(isMulti){
          var colLabels=sec.multiCols||it.cols||[];
          legHtml='<span class="vti-leg-group-wrap">';
          legHtml+='<span class="vti-leg-group-labels">';
          for(var cl2=0;cl2<it.st.length;cl2++) legHtml+='<span>'+(colLabels[cl2]||(cl2+1))+'</span>';
          legHtml+='</span>';
          legHtml+='<span class="vti-leg-group">';
          for(var ci=0;ci<it.st.length;ci++){
            var cStKey=(it.st[ci]&&it.st[ci]!=='')?it.st[ci]:'--';
            var cLegLbl=cStKey==='--'?'—':cStKey.toUpperCase();
            var cLabel=colLabels[ci]||(ci+1);
            legHtml+='<span class="vti-leg vti-leg-sm st-'+cStKey+'" tabindex="0" role="button" onclick="event.stopPropagation();openVtiStPopover('+idx+','+s+','+i+','+ci+',this)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();event.stopPropagation();openVtiStPopover('+idx+','+s+','+i+','+ci+',this);}" title="'+cLabel+'">'+cLegLbl+'</span>';
          }
          legHtml+='</span>';
          legHtml+='</span>';
        } else {
          var stKey=(it.st&&it.st!=='')?it.st:'--';
          var legLbl=stKey==='--'?'—':stKey.toUpperCase();
          legHtml='<span class="vti-leg st-'+stKey+'" tabindex="0" role="button" onclick="event.stopPropagation();openVtiStPopover('+idx+','+s+','+i+',null,this)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();event.stopPropagation();openVtiStPopover('+idx+','+s+','+i+',null,this);}" title="Toque para escolher o status">'+legLbl+'</span>';
        }

        var isExpanded=!!_vtiExpandedRows[detailId];
        clH+='<div class="vti-row'+(isMulti?' vti-row-multi':'')+'" id="vitem-'+idx+'-'+s+'-'+i+'">';
        clH+='<div class="vti-row-main" onclick="_toggleVtiRow(\''+detailId+'\',this)">';
        clH+='<span class="vti-expand-icon">'+(isExpanded?'▾':'▸')+'</span>';
        clH+='<span class="vti-num">'+(i+1)+'.</span>';
        clH+='<span class="vti-sinopse">'+it.n+indicators+'</span>';
        clH+=legHtml;
        clH+='</div>';

        clH+='<div class="vti-row-detail" id="'+detailId+'" style="display:'+(isExpanded?'block':'none')+';">';
        clH+='<textarea rows="2" class="cl-textarea" placeholder="Adicionar observação ou notas..." oninput="saveObsVTIVTE('+idx+','+s+','+i+',this.value)">'+obsVal+'</textarea>';
        clH+='<div class="cl-photos-section"><label class="cl-photos-label">Fotos e Evidências</label><div class="cl-photos-grid">';
        for(var fp=0;fp<it.fotos.length;fp++){
          var foto=it.fotos[fp];
          var src=typeof foto==='string'?foto:(foto.d||'');
          var by=typeof foto==='string'?'Unknown':(foto.by||'Unknown');
          clH+='<div class="cl-photo-item">';
          clH+='<img src="'+src+'" onclick="verImg(\''+src+'\')" class="cl-photo-thumb">';
          clH+='<button class="cl-photo-remove" onclick="rmFotoVTIVTE('+idx+','+s+','+i+','+fp+')" title="Remover">✕</button>';
          clH+='<span class="cl-photo-info">'+by.substring(0,10)+'</span>';
          clH+='</div>';
        }
        clH+='<button class="cl-photo-add" onclick="abrirModFotoVTIVTE('+idx+','+s+','+i+')">📷 Adicionar Foto</button>';
        clH+='</div></div>';

        clH+='</div>';
        clH+='</div>';
      }
      clH+='</div>';
    }

    var admH='';
    admH+='<button class="btn-blue" onclick="viewActiveVTIVTE('+idx+')">👁 Visualizar</button>';
    if(ME&&(typeof isAdm==='function'?isAdm(ME.role):ME.role==='adm')){
      admH+='<button class="btn-red" onclick="deleteVTIVTE('+idx+')">🗑 Excluir</button>';
      admH+='<button class="btn-blue" onclick="addItemVTIVTE('+idx+')">➕ Adicionar Item</button>';
    }
    admH+='<button class="btn-green" onclick="finalizeVTIVTE('+idx+')">✓ Finalizar</button>';

    var d=document.createElement('div');
    d.className='av '+res;
    d.innerHTML=
      '<div class="av-header">'+
        '<div class="av-title">'+
          '<h3>✈️ '+sr.mat+' — '+sr.type+'</h3>'+
          '<div class="tags"><span class="tag">🔗 Model: '+sr.mod+'</span></div>'+
        '</div>'+
        '<span class="badge '+bCls+'">'+bLbl+'</span>'+
      '</div>'+jumpBar+clH+
      '<div class="acoes">'+admH+'</div>';
    lista.appendChild(d);
  }
}

// ===== VIEW ACTIVE =====
function viewActiveVTIVTE(idx){
  if(!AVSVTIVTE[idx]){ alert('Vistoria não encontrada.'); return; }
  var insp=AVSVTIVTE[idx];
  var modal=document.getElementById('mod-fin-vtivte');
  var content=document.getElementById('mod-fin-vtivte-content');
  if(!modal||!content) return;

  var res=sgResVTIVTE(insp.cl);
  var rTxt=res==='ok'?'SATISFATÓRIO':res==='warn'?'FT FALTANDO':res==='danger'?'DF DEFICIENTE':'EM ANDAMENTO';
  var rCls=res==='ok'?'ok':res==='warn'?'warn':res==='danger'?'danger':'pending';

  var html='<div class="fin-actions-top">';
  html+='<span style="font-weight:700;color:#1a2a4a;font-size:15px;">👁 Vistoria Ativa</span>';
  html+='<button class="btn-outline" onclick="document.getElementById(\'mod-fin-vtivte\').style.display=\'none\'">✕ Fechar</button>';
  html+='</div>';
  html+='<div class="fin-flight-header">';
  html+='<h3>✈️ '+_h(insp.type||'VTI/VTE')+' — '+_h(insp.mat||'')+'</h3>';
  html+='<div class="fin-flight-tags">';
  html+='<span class="fin-flight-tag">👤 '+_h(insp.resp||'')+'</span>';
  html+='<span class="fin-flight-tag">🔗 Modelo: '+_h(insp.mod||'')+'</span>';
  if(insp.di) html+='<span class="fin-flight-tag">📅 '+_h(insp.di)+'</span>';
  html+='</div></div>';
  html+='<div class="fin-flight-status-summary"><strong>Resultado Atual:</strong>';
  html+='<span class="fin-flight-status-badge '+rCls+'">'+rTxt+'</span></div>';

  (insp.cl||[]).forEach(function(sec){
    if(!sec||!sec.s) return;
    html+='<div class="fin-flight-section"><div class="fin-flight-section-title">'+_h(sec.s)+'</div>';
    (sec.items||[]).forEach(function(it){
      if(!it||!it.n) return;
      var stD=_vtiStDisplay(it.st);
      html+='<div class="fin-flight-item">';
      html+='<span class="fin-flight-item-name">'+_h(it.n)+'</span>';
      html+='<span class="fin-flight-status-badge '+stD.cls+'" style="font-size:11px;">'+stD.lbl+'</span>';
      if(it.obs) html+='<div style="font-size:12px;color:#555;margin-top:4px;">'+_h(it.obs)+'</div>';
      html+='</div>';
    });
    html+='</div>';
  });

  content.innerHTML=html;
  modal.style.display='flex';
}

// ===== DELETE ACTIVE =====
function deleteVTIVTE(idx){
  if(!AVSVTIVTE[idx]) return;
  if(!confirm('Excluir a vistoria de '+AVSVTIVTE[idx].mat+'? Esta ação não pode ser desfeita.')) return;
  AVSVTIVTE.splice(idx,1);
  saveVTIVTE();
  renderVTIVTE();
  _showToast('✅ Vistoria excluída','ok');
}

// ===== ADD ITEM =====
function addItemVTIVTE(idx){
  var itemName=prompt('Digite o nome do item:');
  if(!itemName||!itemName.trim()) return;
  // FIX: was .cls — corrected to .cl
  var lastSection=AVSVTIVTE[idx].cl[AVSVTIVTE[idx].cl.length-1];
  lastSection.items.push({n:itemName.trim(),st:'--',by:ME?ME.nome:'Unknown',dt:dh(),obs:'',fotos:[]});
  saveVTIVTE();
  renderVTIVTE();
  _showToast('✅ Item adicionado','ok');
}

// ===== FINALIZE =====
function finalizeVTIVTE(idx){
  if(!AVSVTIVTE[idx]){ console.error('Inspection not found'); return; }
  var insp=AVSVTIVTE[idx];
  var res=sgResVTIVTE(insp.cl);

  FINSVTIVTE.unshift({
    id:insp.id, type:insp.type, mat:insp.mat, mod:insp.mod,
    serie:insp.serie, resp:insp.resp, dc:insp.dc, df:dh(),
    by:ME?ME.nome:'Unknown', res:res,
    cl:JSON.parse(JSON.stringify(insp.cl))
  });

  var _mat=insp.mat, _type=insp.type||'VTI/VTE';
  if(typeof logActivity==='function')logActivity('fin_vtivte',_mat+' ('+_type+')');
  AVSVTIVTE.splice(idx,1);
  saveVTIVTE();
  if(typeof cloudSave==='function')cloudSave(true);
  renderVTIVTE();
  renderFinVTIVTE();
  _showFinalizeSuccess(_mat + ' — ' + _type);
  _showToast('✅ Vistoria finalizada!','ok');
  aba('fin');
}

// ===== VIEW COMPLETED =====
function viewFinVTIVTE(idx){
  if(idx<0||!FINSVTIVTE[idx]){ alert('Registro não encontrado.'); return; }
  var fin=FINSVTIVTE[idx];
  var modal=document.getElementById('mod-fin-vtivte');
  var content=document.getElementById('mod-fin-vtivte-content');
  currentFinVTIVTEIdx=idx;

  var rTxt=fin.res==='ok'?'SATISFATÓRIO':fin.res==='warn'?'FT FALTANDO':fin.res==='danger'?'DF DEFICIENTE':'PENDENTE';
  var rCls=fin.res==='ok'?'ok':fin.res==='warn'?'warn':fin.res==='danger'?'danger':'neutral';

  var topActionsHtml=
    '<div class="fin-actions-top">'+
      '<button class="btn-green" onclick="exportPDFVTIVTE('+idx+')">📄 Exportar PDF</button>'+
      '<button class="btn-outline" onclick="fecharModalFinVTIVTE()">✕ Fechar</button>'+
    '</div>';

  var modalContentHtml=
    '<div class="fin-flight-header">'+
      '<h3>✈️ Vistoria '+fin.type+' — '+fin.mat+'</h3>'+
      '<div class="fin-flight-tags">'+
        '<span class="fin-flight-tag">👤 '+fin.resp+'</span>'+
        '<span class="fin-flight-tag">🔗 N/S: '+fin.serie+'</span>'+
        '<span class="fin-flight-tag">📅 '+(fin.df||'N/A')+'</span>'+
      '</div>'+
    '</div>'+
    '<div class="fin-flight-status-summary"><strong>Resultado Geral:</strong>'+
      '<span class="fin-flight-status-badge '+rCls+'">'+rTxt+'</span>'+
    '</div>';

  (fin.cl||[]).forEach(function(sec){
    if(!sec||!sec.s) return;
    modalContentHtml+='<div class="fin-flight-section"><div class="fin-flight-section-title">'+sec.s+'</div>';
    (sec.items||[]).forEach(function(it){
      if(!it||!it.n) return;
      var _d=_vtiStDisplay(it.st);
      var stCls=_d.cls==='ok'?'ac':_d.cls==='na'?'np':_d.cls==='warn'?'re':_d.cls==='danger'?'na':'pending';
      var stTxt=Array.isArray(it.st)?_d.lbl:(it.st==='ok'?'✓ OK':it.st==='na'?'NA':it.st==='ft'?'FT':it.st==='df'?'DF':it.st==='aero'?'✓ AERONAVEGÁVEL':it.st==='naoaero'?'NÃO-AERONAVEGÁVEL':'[ ]');
      modalContentHtml+=
        '<div class="fin-flight-item">'+
          '<div class="fin-flight-item-header">'+
            '<span class="fin-flight-item-status '+stCls+'">'+stTxt+'</span>'+
            '<span class="fin-flight-item-name">'+it.n+'</span>'+
          '</div>';

      if(it.obs){
        var _hv=function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
        modalContentHtml+='<div class="fin-flight-item-note"><strong>Observação:</strong> '+_hv(it.obs)+'</div>';
      }

      var fotos=it.fotos||[];
      if(fotos.length){
        modalContentHtml+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:8px;padding-top:10px;border-top:1px dashed #f0f4f8;">';
        fotos.forEach(function(fotoItem){
          var src=typeof fotoItem==='string'?fotoItem:(fotoItem.d||'');
          var by=typeof fotoItem==='string'?'Unknown':(fotoItem.by||'Unknown');
          var dt=typeof fotoItem==='string'?'N/A':(fotoItem.dt||'N/A');
          if(!src||src.length<100) return;
          modalContentHtml+=
            '<div style="position:relative;aspect-ratio:1;border:1px solid #dde3ed;border-radius:8px;overflow:hidden;background:#f7fafd;cursor:pointer;" onclick="verImg(\''+src.replace(/'/g,"\\'")+'\')">'+
              '<img src="'+src+'" style="width:100%;height:100%;object-fit:cover;">'+
              '<span style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.6);color:white;font-size:9px;padding:2px 4px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="Por: '+by+' em '+dt+'">'+by.substring(0,10)+'</span>'+
            '</div>';
        });
        modalContentHtml+='</div>';
      }

      modalContentHtml+='</div>';
    });
    modalContentHtml+='</div>';
  });

  content.innerHTML=topActionsHtml+modalContentHtml;
  modal.style.display='flex';
}

// ===== CLOSE MODAL VTI/VTE =====
function fecharModalFinVTIVTE(){
  var modal=document.getElementById('mod-fin-vtivte');
  if(modal) modal.style.display='none';
  currentFinVTIVTEIdx=null;
}

// ===== DELETE COMPLETED =====
function delFinVTIVTE(idx){
  if(!confirm('Excluir esta vistoria finalizada?')) return;
  FINSVTIVTE.splice(idx,1);
  saveVTIVTE();
  renderFinVTIVTE();
  _showToast('✅ Excluída','ok');
}

// ===== RENDER COMPLETED VTI/VTE =====
function renderFinVTIVTE(){
  var grid    = document.getElementById('completed-vtivte-grid');
  var section = document.getElementById('completed-vtivte-section');
  if(!grid||!section){ console.warn('VTI/VTE completed elements not found'); return; }

  var list=FINSVTIVTE.filter(function(sr){ return sr.type==='VTI'||sr.type==='VTE'; });
  grid.innerHTML='';
  if(!list.length){ section.style.display='none'; return; }
  section.style.display='block';

  list.forEach(function(sr){
    var realIdx=FINSVTIVTE.indexOf(sr);
    var bannerColor=sr.type==='VTI'?'#81C784':'#2E7D32';
    var stClass=sr.res==='ok'?'ok':sr.res==='warn'?'warn':'danger';
    var stIcon=sr.res==='ok'?'✓':sr.res==='warn'?'⚠️':'✕';
    var stLabel=sr.res==='ok'?'OK — SATISFATÓRIO':sr.res==='warn'?'FT — FALTANDO':'DF — DEFICIENTE';

    var card=document.createElement('div');
    card.className='completed-card '+stClass;
    card.setAttribute('data-type', sr.type.toLowerCase());
    card.setAttribute('data-status', sr.res);
    card.innerHTML=
      '<div style="background:'+bannerColor+';color:white;padding:12px 16px;border-radius:8px 8px 0 0;">'+
        '<div style="font-weight:bold;font-size:13px;">VISTORIA '+sr.type+'</div>'+
      '</div>'+
      '<div style="padding:16px;flex:1;display:flex;flex-direction:column;">'+
        '<h4 style="margin:0 0 8px 0;color:#1a2a4a;font-size:14px;">'+sr.mat+' — '+sr.mod+'</h4>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;font-size:12px;color:#666;">'+
          '<span>👤 '+(sr.resp||'N/A')+'</span>'+
          '<span>🔗 N/S: '+(sr.serie||'N/A')+'</span>'+
          '<span>📅 '+(sr.df||'N/A')+'</span>'+
        '</div>'+
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">'+
          '<span style="font-size:16px;">'+stIcon+'</span>'+
          '<span style="font-weight:bold;color:#1a2a4a;font-size:13px;">'+stLabel+'</span>'+
        '</div>'+
        '<div style="margin-top:auto;display:flex;gap:8px;flex-wrap:wrap;">'+
          '<button onclick="viewFinVTIVTE('+realIdx+')" style="flex:1;minwidth:90px;padding:12px 14px;border:none;border-radius:8px;background:linear-gradient(135deg, #2196F3 0%, #1976D2 100%);color:white;cursor:pointer;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(33,150,243,0.3);transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;gap:6px;">👁️ Ver</button>'+
          '<button onclick="exportPDFVTIVTE('+realIdx+')" style="flex:1;minwidth:90px;padding:12px 14px;border:none;border-radius:8px;background:linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);color:white;cursor:pointer;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(76,175,80,0.3);transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;gap:6px;">📄 PDF</button>'+
          '<button onclick="abrirSeletorOneDriveVTIVTE('+realIdx+')" style="flex:1;minwidth:90px;padding:12px 14px;border:none;border-radius:8px;background:linear-gradient(135deg, #0078D4 0%, #005A9E 100%);color:white;cursor:pointer;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(0,120,212,0.3);transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;gap:6px;">☁️ OneDrive</button>'+
          '<button onclick="delFinVTIVTE('+realIdx+')" style="flex:1;minwidth:90px;padding:12px 14px;border:none;border-radius:8px;background:linear-gradient(135deg, #F44336 0%, #D32F2F 100%);color:white;cursor:pointer;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(244,67,54,0.3);transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;gap:6px;">🗑️ Excluir</button>'+
        '</div>'+
      '</div>';
    grid.appendChild(card);
  });

  var countEl=document.getElementById('completed-vtivte-count');
  if(countEl) countEl.textContent=list.length;
}

// ===== TOGGLE FORM =====
function toggleVTIVTEForm(){
  var form=document.getElementById('form-vtivte-adm');
  var btn=document.getElementById('toggle-vtivte-form');
  if(!form||!btn) return;
  var isHidden=form.style.display==='none'||form.style.display==='';
  form.style.display=isHidden?'block':'none';
  btn.textContent=isHidden?'✖ Ocultar Formulário':'➕ Nova Vistoria';
  btn.className=isHidden?'btn-red':'btn-outline';
}

// ===== EXPORT PDF =====
function exportPDFVTIVTE(idx){
  if(idx===undefined) idx=currentFinVTIVTEIdx;
  if(idx===null||idx<0||!FINSVTIVTE[idx]){ alert('❌ Nenhuma vistoria VTI/VTE selecionada para exportação.'); return; }
  if(typeof window.jspdf==='undefined'){ alert('❌ Biblioteca de PDF não carregada. Atualize a página.'); return; }

  var insp=FINSVTIVTE[idx];
  var doc=new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  var lm=12,rm=198,pw=186;
  var y=0;
  var chkPage=function(){if(y>268){doc.addPage();y=16;}};

  var C_NAVY=[26,42,74],C_BLUE=[74,144,217],C_WHITE=[255,255,255];
  var C_GREEN=[46,125,50],C_ORANGE=[230,81,0],C_RED=[198,40,40],C_GREY=[120,120,120],C_TEXT=[30,30,30];

  // ── HEADER BAND ────────────────────────────────────────────────────────────
  doc.setFillColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);
  doc.rect(0,0,210,38,'F');
  doc.setFillColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);
  doc.rect(0,34,210,4,'F');
  try{
    if(window._logoTB&&window._logoTB.complete&&window._logoTB.naturalWidth>0){
      var cvs=document.createElement('canvas');
      cvs.width=window._logoTB.naturalWidth;cvs.height=window._logoTB.naturalHeight;
      cvs.getContext('2d').drawImage(window._logoTB,0,0);
      var _lmxW=50,_lmxH=24,_lpW,_lpH;
      if(window._logoTB.naturalWidth*_lmxH>window._logoTB.naturalHeight*_lmxW){_lpW=_lmxW;_lpH=Math.round(_lmxW*window._logoTB.naturalHeight/window._logoTB.naturalWidth*10)/10;}
      else{_lpH=_lmxH;_lpW=Math.round(_lmxH*window._logoTB.naturalWidth/window._logoTB.naturalHeight*10)/10;}
      doc.addImage(cvs.toDataURL('image/png'),'PNG',148,4,_lpW,_lpH);
    }
  }catch(e){}
  doc.setFontSize(9);doc.setFont(undefined,'normal');doc.setTextColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);
  doc.text('TB Aviation',lm,10);
  var typeTitle='VISTORIA '+(insp.type||'VTI/VTE').toUpperCase();
  doc.setFontSize(18);doc.setFont(undefined,'bold');doc.setTextColor(C_WHITE[0],C_WHITE[1],C_WHITE[2]);
  doc.text(typeTitle,lm,19);
  doc.setFontSize(10);doc.setFont(undefined,'normal');
  doc.text('Relatório de Vistoria '+(insp.type||'VTI/VTE'),lm,26);
  doc.setFontSize(8);doc.setTextColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);
  doc.text('Gerado em: '+dh(),lm,32);
  y=46;

  // ── AIRCRAFT INFO CARD ────────────────────────────────────────────────────
  var _acPh=(typeof REG_IMGS!=='undefined'?REG_IMGS[insp.mat]||'':'');
  var _cH=_acPh?56:40,_cY=y;
  doc.setFillColor(240,246,255);
  doc.setDrawColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);doc.setLineWidth(0.5);
  doc.roundedRect(lm,y,pw,_cH,3,3,'FD');
  if(_acPh){try{
    var _ff=_acPh.indexOf('data:image/png')===0?'PNG':'JPEG';
    var _px=lm+pw-58,_py=_cY+15,_pw=54,_ph=_cH-19;
    doc.setFillColor(255,255,255);doc.roundedRect(_px,_py,_pw,_ph,2,2,'F');
    doc.addImage(_acPh,_ff,_px+1,_py+1,_pw-2,_ph-2);
    doc.setDrawColor(180,200,225);doc.setLineWidth(0.3);doc.roundedRect(_px,_py,_pw,_ph,2,2,'S');
  }catch(e){}}
  doc.setFontSize(11);doc.setFont(undefined,'bold');doc.setTextColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);
  doc.text('Informações da Aeronave',lm+4,y+8);
  doc.setDrawColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);doc.setLineWidth(0.3);
  doc.line(lm+4,y+11,(_acPh?lm+pw-62:rm-4),y+11);
  doc.setFontSize(9);doc.setFont(undefined,'normal');doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
  if(_acPh){
    var _rows=[['Matrícula',insp.mat],['Modelo',insp.mod],['Nº de Série',insp.serie],
               ['Responsável',insp.resp],['Criado em',insp.dc||''],['Finalizado em',insp.df]];
    var ry=y+18;
    _rows.forEach(function(r){
      doc.setFont(undefined,'normal');doc.setTextColor(110,110,130);doc.text(r[0],lm+4,ry);
      doc.setFont(undefined,'bold');doc.setTextColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);doc.text(r[1]||'N/A',lm+32,ry);
      doc.setFont(undefined,'normal');doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);ry+=5.5;
    });
  }else{
    var lx=lm+4,rx=lm+96;
    doc.text('Matrícula',lx,y+18);doc.text(':',lx+26,y+18);doc.setFont(undefined,'bold');doc.text(insp.mat||'N/A',lx+29,y+18);doc.setFont(undefined,'normal');
    doc.text('Modelo',rx,y+18);doc.text(':',rx+22,y+18);doc.setFont(undefined,'bold');doc.text(insp.mod||'N/A',rx+25,y+18);doc.setFont(undefined,'normal');
    doc.text('Nº de Série',lx,y+25);doc.text(':',lx+26,y+25);doc.setFont(undefined,'bold');doc.text(insp.serie||'N/A',lx+29,y+25);doc.setFont(undefined,'normal');
    doc.text('Responsável',rx,y+25);doc.text(':',rx+22,y+25);doc.setFont(undefined,'bold');doc.text(insp.resp||'N/A',rx+25,y+25);doc.setFont(undefined,'normal');
    doc.text('Criado em',lx,y+32);doc.text(':',lx+26,y+32);doc.setFont(undefined,'bold');doc.text(insp.dc||'',lx+29,y+32);doc.setFont(undefined,'normal');
    doc.text('Finalizado em',rx,y+32);doc.text(':',rx+22,y+32);doc.setFont(undefined,'bold');doc.text(insp.df||'',rx+25,y+32);doc.setFont(undefined,'normal');
  }
  y=_cY+_cH+8;

  // ── STATUS PILLS ─────────────────────────────────────────────────────────
  var stLbl={'ok':'OK','na':'NA','ft':'FT','df':'DF','aero':'AERONAVEGÁVEL','naoaero':'NÃO-AERONAVEGÁVEL','--':'—','':'—'};
  var stFill={'ok':[232,245,233],'na':[240,240,240],'ft':[255,243,224],'df':[255,235,238],'--':[245,245,245],'':[245,245,245]};
  var stInk={'ok':C_GREEN,'na':[84,110,122],'ft':C_ORANGE,'df':C_RED,'--':C_GREY,'':C_GREY};

  // ── SECTIONS & ITEMS ─────────────────────────────────────────────────────
  doc.setFont(undefined,'normal');doc.setFontSize(8.5);doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);

  (insp.cl||[]).forEach(function(sec,s){
    if(!sec||!sec.s) return;
    chkPage();
    doc.setFillColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);doc.rect(lm,y,pw,7,'F');
    doc.setFillColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);doc.rect(lm,y,3,7,'F');
    doc.setFontSize(8.5);doc.setFont(undefined,'bold');doc.setTextColor(C_WHITE[0],C_WHITE[1],C_WHITE[2]);
    doc.text(sec.s.toUpperCase(),lm+6,y+5);
    y+=10;
    doc.setFont(undefined,'normal');doc.setFontSize(8.5);doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);

    (sec.items||[]).forEach(function(it,i){
      if(!it||!it.n) return;
      chkPage();

      if(it.type==='airworthy'){
        var isAero=it.st==='aero', isNao=it.st==='naoaero';
        var cellW=pw/2, cellH=10, boxY=y-3.5;
        var aeroClr=isAero?[46,125,50]:[120,130,140];
        var naoClr=isNao?[198,40,40]:[120,130,140];
        doc.setFillColor(aeroClr[0],aeroClr[1],aeroClr[2]);doc.rect(lm,boxY,cellW,cellH,'F');
        doc.setFillColor(naoClr[0],naoClr[1],naoClr[2]);doc.rect(lm+cellW,boxY,cellW,cellH,'F');
        doc.setDrawColor(255,255,255);doc.setLineWidth(0.5);doc.line(lm+cellW,boxY,lm+cellW,boxY+cellH);
        doc.setFont(undefined,'bold');doc.setFontSize(9);doc.setTextColor(255,255,255);
        doc.text((isAero?'[X] ':'[ ] ')+'AERONAVEGÁVEL',lm+cellW/2,boxY+cellH/2+1.5,{align:'center'});
        doc.text((isNao?'[X] ':'[ ] ')+'NÃO-AERONAVEGÁVEL',lm+cellW+cellW/2,boxY+cellH/2+1.5,{align:'center'});
        doc.setFont(undefined,'normal');doc.setFontSize(8.5);doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
        y=boxY+cellH+4;
        return;
      }

      var isMultiPdf=Array.isArray(it.st);
      var iLines=doc.splitTextToSize((i+1)+'.  '+it.n,isMultiPdf?pw-(10*it.st.length+14):pw-22);

      if(i%2===0){doc.setFillColor(248,250,253);doc.rect(lm,y-3.5,pw,6,'F');}
      doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
      doc.text(iLines,lm+2,y);

      if(isMultiPdf){
        var mPillW=9,mGap=1.5,mPillX=rm-mPillW;
        for(var mc=it.st.length-1;mc>=0;mc--){
          var mStKey=(it.st[mc]&&it.st[mc]!=='')?it.st[mc]:'--';
          var mLbl=stLbl[mStKey]||'—';
          var mFill=stFill[mStKey]||stFill[''];
          var mInk=stInk[mStKey]||stInk[''];
          doc.setFillColor(mFill[0],mFill[1],mFill[2]);doc.roundedRect(mPillX,y-3.5,mPillW,5.5,1,1,'F');
          doc.setFontSize(6);doc.setFont(undefined,'bold');doc.setTextColor(mInk[0],mInk[1],mInk[2]);
          doc.text(mLbl,mPillX+mPillW/2,y+0.3,{align:'center'});
          mPillX-=(mPillW+mGap);
        }
        doc.setFont(undefined,'normal');doc.setFontSize(8.5);doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
      } else {
        var stKey=(it.st&&it.st!=='')?it.st:'--';
        var lbl=stLbl[stKey]||'—';
        var fill=stFill[stKey]||stFill[''];
        var ink=stInk[stKey]||stInk[''];
        var pillW=12,pillX=rm-pillW;
        doc.setFillColor(fill[0],fill[1],fill[2]);doc.roundedRect(pillX,y-3.5,pillW,5.5,1.2,1.2,'F');
        doc.setFontSize(7);doc.setFont(undefined,'bold');doc.setTextColor(ink[0],ink[1],ink[2]);
        doc.text(lbl,pillX+pillW/2,y+0.3,{align:'center'});
        doc.setFont(undefined,'normal');doc.setFontSize(8.5);doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
      }
      y+=iLines.length*5;

      if(it.obs&&it.obs.trim()){
        chkPage();
        doc.setFontSize(7.5);doc.setTextColor(123,79,0);
        var obsL=doc.splitTextToSize('   Observação: '+it.obs,pw-10);
        doc.text(obsL,lm+4,y);y+=obsL.length*4.5;
        doc.setFontSize(8.5);doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
      }
      if(it.by){
        chkPage();
        doc.setFontSize(7);doc.setTextColor(C_GREY[0],C_GREY[1],C_GREY[2]);
        doc.text('   Por: '+it.by+' | '+(it.dt||'N/A'),lm+4,y);y+=4.5;
        doc.setFontSize(8.5);doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
      }
      (it.fotos||[]).forEach(function(foto,fp){
        var src=typeof foto==='string'?foto:(foto.d||'');
        if(!src||src.length<100) return;
        try{
          var fType=src.indexOf('image/png')>-1?'PNG':'JPEG';
          var _vProps=doc.getImageProperties(src);
          var _vMaxW=160,_vMaxH=100,_vW,_vH;
          if(_vProps.width*_vMaxH>_vProps.height*_vMaxW){_vW=_vMaxW;_vH=Math.round(_vMaxW*_vProps.height/_vProps.width);}
          else{_vH=_vMaxH;_vW=Math.round(_vMaxH*_vProps.width/_vProps.height);}
          if(y+_vH+8>268){doc.addPage();y=16;}
          doc.addImage(src,fType,lm+2,y,_vW,_vH);y+=_vH+3;
          doc.setFontSize(7);doc.setTextColor(C_GREY[0],C_GREY[1],C_GREY[2]);
          doc.text('   Foto '+(fp+1)+' por: '+(foto.by||'Unknown')+' | '+(foto.dt||'N/A'),lm+2,y);y+=5;
          doc.setFontSize(8.5);doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
        }catch(e){
          doc.setFontSize(7.5);doc.setTextColor(200,0,0);
          doc.text('   [Foto não pôde ser carregada]',lm+2,y);y+=5;
          doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
        }
      });
    });
    y+=4;
  });

  // ── FOOTER (every page) ───────────────────────────────────────────────────
  var total=doc.internal.getNumberOfPages();
  for(var pg=1;pg<=total;pg++){
    doc.setPage(pg);
    doc.setFillColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);doc.rect(0,287,210,10,'F');
    doc.setFillColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);doc.rect(0,287,210,1,'F');
    doc.setFontSize(7.5);doc.setFont(undefined,'normal');doc.setTextColor(C_WHITE[0],C_WHITE[1],C_WHITE[2]);
    doc.text('TB Aviation  |  Relatório de Vistoria '+(insp.type||'VTI/VTE')+'  |  '+insp.mat+' — '+insp.mod,lm,292.5);
    doc.text('Página '+pg+' / '+total,rm,292.5,{align:'right'});
  }

  var fileName=(insp.type||'VTIVTE')+'_'+(insp.mat||'UNKNOWN')+'_'+(insp.mod||'MODEL').replace(/ /g,'_')+'.pdf';
  _showPdfSaveDialog(fileName, doc.output('blob'));
}

// ===== INITIALIZE (called once from DOMContentLoaded below) =====
function initVTIVTE(){
  loadVTIVTE();
  renderVTIVTE();
  renderFinVTIVTE();
}

document.addEventListener('DOMContentLoaded', function(){
  var form=document.getElementById('form-vtivte-adm');
  if(form) form.style.display='none';

  var btnVTIVTE=document.getElementById('btn-save-vtivte');
  if(btnVTIVTE) btnVTIVTE.addEventListener('click', salvarFotoVTIVTE);

  var modFinVTIVTE=document.getElementById('mod-fin-vtivte');
  if(modFinVTIVTE) modFinVTIVTE.addEventListener('click',function(e){ if(e.target===this) fecharModalFinVTIVTE(); });

  initVTIVTE();
});

// ===== ABRIR SELETOR DE PASTA ONEDRIVE (VTI/VTE) =====
function abrirSeletorOneDriveVTIVTE(idx) {
  if(idx < 0 || !FINSVTIVTE[idx]) { alert('Registro não encontrado.'); return; }
  _odPickerOpen(idx, 'vtivte');
}

// ===== CONFIRMAR UPLOAD PARA ONEDRIVE (VTI/VTE) =====
function confirmarUploadOneDriveVTIVTE(idx) {
  if(idx < 0 || !FINSVTIVTE[idx]) { alert('Registro não encontrado.'); return; }

  var isShared = (_odPicker.mode === 'shared');
  var _driveId = _odPicker.driveId, _itemId = _odPicker.itemId;
  var folder   = _odPicker.path || 'VTI_VTE';
  currentFinVTIVTEIdx = idx;

  _odUploadPending = {driveId:_driveId, itemId:_itemId, folder:folder, isShared:isShared};
  setTimeout(function(){_odUploadPending=null;}, 10000);

  _odPickerClose();

  try {
    exportPDFVTIVTE(idx);
  } catch(e) {
    _odUploadPending=null;
    console.error('Error generating PDF for OneDrive:', e);
    alert('❌ Erro ao gerar PDF:\n' + (e.message || e));
  }
}
