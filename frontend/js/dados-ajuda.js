/*
 * VHARAK | dados-ajuda.js
 * Conteudo da Central de Ajuda: 8 categorias e 18 problemas.
 *
 * Migrado de frontend-antigo/js/ajuda-dados.js por tools/migrar-ajuda.js.
 * Cada solucao e um par de titulo e texto -- nada aqui depende de logica.
 */
(function (global) {
  'use strict';

  var VH = global.VH || (global.VH = {});

  VH.ajuda = {
    categorias: [
        {
              "slug": "conta",
              "nome": "Conta e acesso"
        },
        {
              "slug": "compras",
              "nome": "Compras e carrinho"
        },
        {
              "slug": "pagamentos",
              "nome": "Pagamentos"
        },
        {
              "slug": "pedidos",
              "nome": "Pedidos e entrega"
        },
        {
              "slug": "produtos",
              "nome": "Jogos e consoles"
        },
        {
              "slug": "devolucao",
              "nome": "Cancelamento e reembolso"
        },
        {
              "slug": "seguranca",
              "nome": "Segurança e privacidade"
        },
        {
              "slug": "outros",
              "nome": "Outras dúvidas"
        }
  ],

    problemas: [
        {
              "id": "conta",
              "titulo": "Problemas com minha conta",
              "resumo": "O acesso à conta, o cadastro ou os seus dados não estão se comportando como deveria.",
              "categoria": "conta",
              "termos": [
                    "conta",
                    "perfil",
                    "dados",
                    "acesso",
                    "usuario"
              ],
              "relacionados": [
                    "login",
                    "cadastro",
                    "dados-conta",
                    "senha"
              ],
              "solucoes": [
                    {
                          "titulo": "Confirme que você está na loja certa",
                          "texto": "Verifique o endereço do site antes de entrar. A VHARAK pede o acesso apenas nas páginas de Login e Cadastro, e nunca por mensagem."
                    },
                    {
                          "titulo": "Use sempre o mesmo e-mail no cadastro",
                          "texto": "O e-mail é a identidade da conta. Se você se cadastrou com um endereço e está tentando entrar com outro, o acesso é recusado."
                    },
                    {
                          "titulo": "Saia da conta antes de entrar novamente",
                          "texto": "Se a loja mantiver uma sessão antiga no navegador, feche a sessão na própria página da conta e entre de novo com o mesmo e-mail."
                    },
                    {
                          "titulo": "Verifique se a conta não está desativada",
                          "texto": "Contas desativadas não conseguem entrar. A tela informa esse caso com uma mensagem específica — nesse caso, é a loja que precisa reativar o acesso."
                    },
                    {
                          "titulo": "Confira se a sessão não expirou",
                          "texto": "Por segurança, o acesso é temporário. Se a página pedir o login novamente sem você ter feito nada, entre outra vez."
                    }
              ]
        },
        {
              "id": "login",
              "titulo": "Não consigo fazer login",
              "resumo": "A senha é recusada mesmo com o e-mail e a senha aparentemente corretos.",
              "categoria": "conta",
              "termos": [
                    "login",
                    "entrar",
                    "acessar",
                    "acesso negado",
                    "senha",
                    "email",
                    "nao entra"
              ],
              "relacionados": [
                    "senha",
                    "conta",
                    "dados-conta"
              ],
              "solucoes": [
                    {
                          "titulo": "Confira se o e-mail foi digitado corretamente",
                          "texto": "Bastam um espaço no começo ou no fim, ou um ponto faltando no domínio, para o acesso ser recusado."
                    },
                    {
                          "titulo": "Verifique se o Caps Lock está ligado",
                          "texto": "A caixa alta troca A por a e M por n sem aviso. É a causa mais comum de senha recusada."
                    },
                    {
                          "titulo": "Leia a mensagem que aparece na tela",
                          "texto": "A loja diferencia três situações: e-mail ou senha inválidos, conta desativada e muitas tentativas seguidas. A mensagem indica qual delas é."
                    },
                    {
                          "titulo": "Depois de várias tentativas, aguarde alguns minutos",
                          "texto": "Para proteger a conta, a loja limita a quantidade de tentativas por período. Fazer muitas vezes seguidas só prolonga o bloqueio."
                    },
                    {
                          "titulo": "Tente uma única vez, com calma",
                          "texto": "Digite a senha em um único campo, sem trocar de aba no meio, e confirme que o navegador não preencheu sozinho um endereço antigo."
                    }
              ]
        },
        {
              "id": "senha",
              "titulo": "Esqueci minha senha",
              "resumo": "A senha não está na memória e é preciso recuperar ou redefinir o acesso.",
              "categoria": "conta",
              "termos": [
                    "senha",
                    "esqueci",
                    "recuperar",
                    "redefinir",
                    "perdi",
                    "password"
              ],
              "relacionados": [
                    "login",
                    "dados-conta",
                    "conta"
              ],
              "solucoes": [
                    {
                          "titulo": "Tente a senha do cadastro",
                          "texto": "A senha da VHARAK é a que você criou no cadastro — a senha do seu e-mail, do banco ou da plataforma de jogo não funciona aqui."
                    },
                    {
                          "titulo": "Se ainda estiver na conta, troque a senha por lá",
                          "texto": "Com a sessão aberta, a troca de senha é feita dentro da própria área da conta. Não é preciso sair nem pedir ajuda a ninguém."
                    },
                    {
                          "titulo": "Se não consegue entrar, peça a redefinição à loja",
                          "texto": "Na Central de Ajuda, use o botão de atendimento no fim desta página e escreva que esqueceu a senha. A loja confirma a identidade pelo e-mail cadastrado e orienta a troca."
                    },
                    {
                          "titulo": "Ao escolher uma nova senha, observe o mínimo",
                          "texto": "A senha precisa ter pelo menos 8 caracteres. Uma frase longa é mais fácil de lembrar do que uma sequência embaralhada."
                    },
                    {
                          "titulo": "Não envie sua senha para ninguém",
                          "texto": "Ninguém da VHARAK pede a sua senha por mensagem, telefone ou e-mail. Quem pede é alguém tentando entrar na sua conta."
                    }
              ]
        },
        {
              "id": "cadastro",
              "titulo": "Problemas com o cadastro",
              "resumo": "A criação da conta está sendo recusada ou o cadastro não termina.",
              "categoria": "conta",
              "termos": [
                    "cadastro",
                    "criar conta",
                    "conta nova",
                    "registro",
                    "cadastrar"
              ],
              "relacionados": [
                    "conta",
                    "login",
                    "senha"
              ],
              "solucoes": [
                    {
                          "titulo": "Preencha todos os campos obrigatórios",
                          "texto": "São eles: nome completo, e-mail, senha, confirmação da senha e a marcação dos termos de uso e da política de privacidade."
                    },
                    {
                          "titulo": "A senha precisa ter pelo menos 8 caracteres",
                          "texto": "A loja recusa senhas curtas antes de qualquer verificação, para não criar contas com credencial fraca."
                    },
                    {
                          "titulo": "As duas senhas precisam ser idênticas",
                          "texto": "A confirmação existe justamente para evitar erro de digitação. Compare os dois campos antes de continuar."
                    },
                    {
                          "titulo": "Use um e-mail que ainda não foi cadastrado",
                          "texto": "Cada e-mail corresponde a uma única conta. Se o endereço já existir, entre com a senha que você já tinha em vez de criar outra conta."
                    },
                    {
                          "titulo": "Confira se a caixa de termos ficou marcada",
                          "texto": "A criação da conta depende da aceite dos termos. As duas caixas precisam estar marcadas."
                    }
              ]
        },
        {
              "id": "dados-conta",
              "titulo": "Alterar ou corrigir meus dados",
              "resumo": "Quero trocar ou corrigir as informações que aparecem na minha conta.",
              "categoria": "conta",
              "termos": [
                    "alterar dados",
                    "corrigir",
                    "telefone",
                    "nome",
                    "endereco",
                    "perfil"
              ],
              "relacionados": [
                    "conta",
                    "senha",
                    "pedido-nao-aparece"
              ],
              "solucoes": [
                    {
                          "titulo": "Edite pela própria área da conta",
                          "texto": "Os dados que você pode alterar sozinho são os exibidos no seu perfil. Salve e a página passa a mostrar a versão nova."
                    },
                    {
                          "titulo": "Trocou o e-mail? Confirme o endereço novo",
                          "texto": "O e-mail identifica a conta e é usado para falar com você sobre pedidos. Depois de trocá-lo, use o novo endereço nos próximos acessos."
                    },
                    {
                          "titulo": "Endereços de entrega ficam em uma área separada",
                          "texto": "O endereço usado na entrega não é o endereço do seu perfil. Cada pedido pode apontar para um endereço salvo à parte."
                    },
                    {
                          "titulo": "Confirme a alteração olhando a conta de novo",
                          "texto": "Se a página continuar mostrando o valor antigo, atualize a loja antes de concluir que a troca não foi salva."
                    }
              ]
        },
        {
              "id": "carrinho",
              "titulo": "Problemas com o carrinho",
              "resumo": "Itens que somem, quantidades erradas ou produtos que não entram no carrinho.",
              "categoria": "compras",
              "termos": [
                    "carrinho",
                    "sacola",
                    "item",
                    "quantidade",
                    "produto",
                    "adicionar"
              ],
              "relacionados": [
                    "checkout",
                    "versoes",
                    "consoles"
              ],
              "solucoes": [
                    {
                          "titulo": "O carrinho é salvo apenas neste navegador",
                          "texto": "A VHARAK guarda o carrinho no dispositivo em que você está, e não na conta. Se você trocar de navegador ou de celular, o carrinho começa vazio."
                    },
                    {
                          "titulo": "Confira se o produto está disponível",
                          "texto": "Item sem estoque não entra no carrinho. A loja avisa nessa situação em vez de aceitar um pedido que não pode ser separado."
                    },
                    {
                          "titulo": "A quantidade máxima por item é de 99 unidades",
                          "texto": "O carrinho para em 99 unidades do mesmo produto. Se precisar de uma quantidade maior, fale com a loja para negociar o pedido."
                    },
                    {
                          "titulo": "Escolha a versão antes de adicionar",
                          "texto": "Jogos e consoles podem ter versão física e digital. O que vai para o carrinho é a versão marcada na página do produto."
                    },
                    {
                          "titulo": "Atualize a página se a lista parecer antiga",
                          "texto": "Preços e disponibilidade podem ter mudado. Recarregar a página do carrinho sincroniza o que está sendo oferecido."
                    }
              ]
        },
        {
              "id": "checkout",
              "titulo": "Não consigo finalizar meu pedido",
              "resumo": "A compra não chega ao fim e a loja não confirma o pedido.",
              "categoria": "compras",
              "termos": [
                    "checkout",
                    "finalizar",
                    "concluir compra",
                    "pedido",
                    "erro",
                    "nao termina"
              ],
              "relacionados": [
                    "carrinho",
                    "pagamento",
                    "pedido-nao-aparece"
              ],
              "solucoes": [
                    {
                          "titulo": "O carrinho precisa ter pelo menos um item",
                          "texto": "Sem item no carrinho, a finalização não começa. Volte ao catálogo e adicione o produto desejado."
                    },
                    {
                          "titulo": "Preencha os dados de entrega por completo",
                          "texto": "Quando o carrinho tem algum produto físico, o endereço é obrigatório: nome, e-mail, CEP, logradouro, número, bairro, cidade e estado."
                    },
                    {
                          "titulo": "Revise a forma de pagamento escolhida",
                          "texto": "A finalização só avança com um método de pagamento selecionado. Trocar o método depois não é permitido."
                    },
                    {
                          "titulo": "Verifique se o CEP é válido",
                          "texto": "Um CEP incompleto impede a busca do endereço e interrompe a finalização antes da hora do pagamento."
                    },
                    {
                          "titulo": "Se aparecer um aviso de indisponibilidade, volte ao carrinho",
                          "texto": "O aviso significa que algum item saiu de estoque. Volte, remova o item e refaça a compra."
                    }
              ]
        },
        {
              "id": "pagamento",
              "titulo": "Problemas com o pagamento",
              "resumo": "A compra é recusada no momento de pagar ou o cartão não é aceito.",
              "categoria": "pagamentos",
              "termos": [
                    "pagamento",
                    "cartao",
                    "pix",
                    "boleto",
                    "pagar",
                    "credito",
                    "debito"
              ],
              "relacionados": [
                    "pagamento-confirmacao",
                    "checkout",
                    "seguranca"
              ],
              "solucoes": [
                    {
                          "titulo": "Conheça as formas de pagamento da VHARAK",
                          "texto": "A loja trabalha com cartão de crédito, PIX e boleto. O método escolhido no início da compra não pode ser trocado depois de finalizar."
                    },
                    {
                          "titulo": "No cartão, confira número, validade e CVV",
                          "texto": "A validade é informada no formato MM/AAAA e precisa estar em dia. O número é conferido dígito a dígito, então um erro em um único algarismo recusa a compra."
                    },
                    {
                          "titulo": "O titular do cartão precisa ser o mesmo informado",
                          "texto": "Nome e CPF do titular são conferidos no momento do pagamento. Divergência entre o cartão e os dados informados é motivo de recusa."
                    },
                    {
                          "titulo": "No PIX e no boleto, a confirmação vem depois",
                          "texto": "Esses dois métodos não são cobrados na hora. O pedido fica aguardando pagamento até a confirmação."
                    }
              ]
        },
        {
              "id": "pagamento-confirmacao",
              "titulo": "Meu pagamento não foi confirmado",
              "resumo": "O valor saiu, mas o pedido continua aguardando confirmação.",
              "categoria": "pagamentos",
              "termos": [
                    "pagamento",
                    "nao confirmado",
                    "pendente",
                    "aguardando",
                    "pix",
                    "boleto",
                    "cobranca"
              ],
              "relacionados": [
                    "pagamento",
                    "acompanhar-pedido",
                    "chave-digital"
              ],
              "solucoes": [
                    {
                          "titulo": "O cartão de crédito é confirmado na hora",
                          "texto": "Se você pagou no cartão e o pedido continua pendente, a compra não foi concluída. Tente finalizar novamente e confira se o número do cartão está correto."
                    },
                    {
                          "titulo": "O PIX e o boleto levam alguns instantes",
                          "texto": "A confirmação destes métodos é automática e costuma acontecer em poucos minutos. O pedido muda de \"aguardando pagamento\" para \"pago\" sozinho."
                    },
                    {
                          "titulo": "Confira se a chave ou linha digitável é a mais recente",
                          "texto": "Cada tentativa gera um código novo. Pagar um código antigo deixa o pedido pendente, mesmo que o valor tenha saído."
                    },
                    {
                          "titulo": "Não pague de novo antes de verificar",
                          "texto": "Se o primeiro pagamento passar a ser reconhecido depois, a segunda cobrança teria de ser devolvida. Espere a confirmação antes de tentar novamente."
                    },
                    {
                          "titulo": "Se passou muito tempo, fale com a loja",
                          "texto": "Depois de horas com o pedido pendente, o atendimento consegue localizar a transação e orientar. Informe o número do pedido na conversa."
                    }
              ]
        },
        {
              "id": "acompanhar-pedido",
              "titulo": "Como acompanho meu pedido",
              "resumo": "Quero saber em que etapa o meu pedido está.",
              "categoria": "pedidos",
              "termos": [
                    "acompanhar",
                    "pedido",
                    "status",
                    "rastreio",
                    "entrega",
                    "andamento",
                    "envio"
              ],
              "relacionados": [
                    "pedido-nao-aparece",
                    "pagamento-confirmacao",
                    "chave-digital"
              ],
              "solucoes": [
                    {
                          "titulo": "O status fica na área da sua conta",
                          "texto": "Com o e-mail e a senha do cadastro, abra a sua conta e entre na lista de pedidos. Cada linha mostra o produto e a etapa atual."
                    },
                    {
                          "titulo": "Conheça as etapas possíveis",
                          "texto": "Um pedido passa por estas etapas: aguardando pagamento, pago, em separação, enviado, concluído e cancelado."
                    },
                    {
                          "titulo": "Pedido só digital vai direto para concluído",
                          "texto": "Quando todos os itens são digitais, não existe separação nem envio: assim que o pagamento é confirmado, o pedido aparece como concluído."
                    },
                    {
                          "titulo": "Pedido com item físico para em \"enviado\" até a entrega",
                          "texto": "A etapa muda para concluído quando a entrega é confirmada. Se passar muito tempo na mesma etapa, o atendimento pode localizar a encomenda."
                    },
                    {
                          "titulo": "Sempre acessível pela mesma conta",
                          "texto": "Como o pedido fica vinculado ao e-mail usado na compra, consultar de outro dispositivo não muda nada — basta entrar com a mesma conta."
                    }
              ]
        },
        {
              "id": "pedido-nao-aparece",
              "titulo": "Meu pedido não aparece no perfil",
              "resumo": "A compra foi feita, mas não está visível na lista de pedidos.",
              "categoria": "pedidos",
              "termos": [
                    "pedido",
                    "nao aparece",
                    "perfil",
                    "historico",
                    "nao encontro",
                    "conta errada"
              ],
              "relacionados": [
                    "acompanhar-pedido",
                    "login",
                    "checkout"
              ],
              "solucoes": [
                    {
                          "titulo": "Entre com o e-mail usado na compra",
                          "texto": "O pedido fica preso ao e-mail da compra. Se você está em outra conta, a lista fica vazia mesmo com a compra feita."
                    },
                    {
                          "titulo": "Atualize a loja depois de entrar",
                          "texto": "A lista de pedidos é carregada no acesso. Atualize a página para buscar as compras mais recentes."
                    },
                    {
                          "titulo": "Pedido cancelado sai da lista de andamento",
                          "texto": "Pedidos cancelados deixam de aparecer entre os pedidos em andamento, mas continuam no histórico da conta."
                    },
                    {
                          "titulo": "Confira se a compra realmente foi confirmada",
                          "texto": "Se a finalização foi interrompida antes do pagamento, nada foi registrado. Nesse caso, o problema é de finalização, não de consulta."
                    }
              ]
        },
        {
              "id": "versoes",
              "titulo": "Dúvidas sobre versões físicas e digitais",
              "resumo": "A diferença entre a edição física e a digital, e como escolher.",
              "categoria": "produtos",
              "termos": [
                    "versao",
                    "fisico",
                    "digital",
                    "fisica",
                    "copia",
                    "download",
                    "edicao"
              ],
              "relacionados": [
                    "chave-digital",
                    "carrinho",
                    "consoles"
              ],
              "solucoes": [
                    {
                          "titulo": "O que é a versão física",
                          "texto": "Você recebe o produto em caixa, com código de barras e nota fiscal. Precisa de endereço de entrega e passa pelas etapas de separação e envio."
                    },
                    {
                          "titulo": "O que é a versão digital",
                          "texto": "Você recebe a chave de ativação ou o acesso para download, sem frete. Não há endereço obrigatório e o pedido vai direto para concluído."
                    },
                    {
                          "titulo": "A versão da página do produto é a que vale",
                          "texto": "Cada produto indica as versões disponíveis. O que for adicionado ao carrinho é exatamente o que foi escolhido."
                    },
                    {
                          "titulo": "Verifique a versão dentro do carrinho",
                          "texto": "Antes de finalizar, confira a versão de cada item. É a última oportunidade de trocar sem precisar cancelar."
                    },
                    {
                          "titulo": "Produto físico exige endereço",
                          "texto": "Pedidos com item físico só são concluídos com endereço de entrega completo."
                    }
              ]
        },
        {
              "id": "chave-digital",
              "titulo": "Chave e download do jogo digital",
              "resumo": "Onde encontrar a chave de ativação ou o download do jogo comprado.",
              "categoria": "produtos",
              "termos": [
                    "chave",
                    "ativacao",
                    "codigo",
                    "download",
                    "digital",
                    "instalar",
                    "jogar"
              ],
              "relacionados": [
                    "versoes",
                    "pagamento-confirmacao",
                    "acompanhar-pedido"
              ],
              "solucoes": [
                    {
                          "titulo": "A chave aparece depois que o pagamento é confirmado",
                          "texto": "Enquanto o pedido está aguardando pagamento, a loja ainda não libera o código. A entrega é automática e não precisa ser solicitada."
                    },
                    {
                          "titulo": "Onde encontrar a chave",
                          "texto": "Entre na sua conta, abra o pedido concluído e consulte os códigos de ativação do item."
                    },
                    {
                          "titulo": "A chave só pode ser usada uma vez",
                          "texto": "Depois de usada, ela não funciona em outro dispositivo. Guarde o código em local seguro antes de digitar."
                    },
                    {
                          "titulo": "Se a chave já aparece como usada e ainda não jogou",
                          "texto": "Isso costuma significar que a chave foi ativada em outra conta ou em outro dispositivo. O código não pode ser reutilizado."
                    },
                    {
                          "titulo": "Não compartilhe a chave nem o link de download",
                          "texto": "A chave dá acesso ao jogo. Compartilhada, ela deixa de funcionar para você."
                    }
              ]
        },
        {
              "id": "consoles",
              "titulo": "Problemas com consoles",
              "resumo": "Dúvidas sobre compatibilidade, acessórios, avarias e o que vem na caixa.",
              "categoria": "produtos",
              "termos": [
                    "console",
                    "playstation",
                    "xbox",
                    "switch",
                    "nintendo",
                    "voltagem",
                    "avaria",
                    "controle"
              ],
              "relacionados": [
                    "versoes",
                    "carrinho",
                    "cancelamento"
              ],
              "solucoes": [
                    {
                          "titulo": "Confira a plataforma do produto",
                          "texto": "A loja trabalha com PlayStation 4 e 5, Nintendo Switch e Switch 2 e Xbox One e Series. Um jogo de uma plataforma não roda em outra."
                    },
                    {
                          "titulo": "Verifique a voltagem antes de ligar",
                          "texto": "Consoles importados podem vir em 110 V ou 220 V. Usar a voltagem errada causa avaria e não é coberto pela garantia."
                    },
                    {
                          "titulo": "A caixa traz apenas o que está no anúncio",
                          "texto": "Controle, cabo, carregador e outros acessórios dependem do produto. Leia a ficha técnica antes de comprar para saber o que vem incluso."
                    },
                    {
                          "titulo": "Console é produto físico e precisa de endereço",
                          "texto": "A entrega de consoles e acessórios é física. O endereço completo é obrigatório para concluir o pedido."
                    },
                    {
                          "titulo": "Se o console chegar com avaria",
                          "texto": "Registre a avaria assim que abrir a caixa, com fotos, e abra uma solicitação de devolução informando o problema. A decisão é da loja."
                    }
              ]
        },
        {
              "id": "avaliacao",
              "titulo": "Não consigo avaliar um jogo",
              "resumo": "A opção de deixar nota e comentário não está disponível.",
              "categoria": "produtos",
              "termos": [
                    "avaliacao",
                    "nota",
                    "estrela",
                    "comentario",
                    "review",
                    "opinao"
              ],
              "relacionados": [
                    "acompanhar-pedido",
                    "chave-digital",
                    "outros"
              ],
              "solucoes": [
                    {
                          "titulo": "Só quem comprou pode avaliar",
                          "texto": "A avaliação é liberada para quem comprou o produto e teve o pagamento confirmado. Isso mantém as notas ligadas a compras reais."
                    },
                    {
                          "titulo": "A nota vai de 1 a 5",
                          "texto": "Escolha a nota dentro dessa faixa e, se quiser, escreva um comentário explicando o que gostou ou o que faltou."
                    },
                    {
                          "titulo": "Você pode alterar a avaliação",
                          "texto": "A nota e o comentário podem ser revistos quantas vezes quiser — vale a pena corrigir se mudar de ideia."
                    },
                    {
                          "titulo": "Cada pessoa avalia uma vez por produto",
                          "texto": "Uma segunda publicação substitui a anterior, em vez de contar como duas avaliações."
                    }
              ]
        },
        {
              "id": "cancelamento",
              "titulo": "Cancelamento e reembolso",
              "resumo": "Quero desistir da compra ou devolver um produto e receber o valor de volta.",
              "categoria": "devolucao",
              "termos": [
                    "cancelamento",
                    "reembolso",
                    "devolucao",
                    "devolver",
                    "estorno",
                    "dinheiro de volta",
                    "desistir"
              ],
              "relacionados": [
                    "pagamento-confirmacao",
                    "acompanhar-pedido",
                    "pedido-nao-aparece"
              ],
              "solucoes": [
                    {
                          "titulo": "Antes do pagamento, basta esvaziar o carrinho",
                          "texto": "Nenhum pedido é criado antes da confirmação do pagamento. Enquanto o pagamento não for confirmado, cancelar é simplesmente não finalizar."
                    },
                    {
                          "titulo": "Depois da confirmação, o cancelamento é feito com a loja",
                          "texto": "Não há cancelamento direto pelo cliente. A solicitação é analisada pela loja, que responde sobre o caso."
                    },
                    {
                          "titulo": "Como funciona a devolução",
                          "texto": "Na solicitação você indica os itens e escreve o motivo. A loja analisa e responde com a decisão — a aprovação devolve o valor do pedido."
                    },
                    {
                          "titulo": "O que acontece quando a devolução é aprovada",
                          "texto": "O pedido passa a cancelado, o pagamento fica marcado como devolvido, o item volta ao estoque e a chave de jogo digital, se houver, é liberada."
                    },
                    {
                          "titulo": "Prazo e forma de retorno são confirmados no atendimento",
                          "texto": "O tempo para o valor chegar e a forma de devolução do produto físico são informados pela loja no atendimento, de acordo com a transportadora e a forma de pagamento usada."
                    }
              ]
        },
        {
              "id": "seguranca",
              "titulo": "Segurança e privacidade",
              "resumo": "Como a loja trata seus dados e como reconhecer uma mensagens falsa.",
              "categoria": "seguranca",
              "termos": [
                    "seguranca",
                    "privacidade",
                    "dados",
                    "golpe",
                    "fraude",
                    "roubo",
                    "senha"
              ],
              "relacionados": [
                    "pagamento",
                    "login",
                    "senha"
              ],
              "solucoes": [
                    {
                          "titulo": "A loja nunca pede a senha do seu e-mail ou do banco",
                          "texto": "O acesso à VHARAK acontece apenas nas páginas da loja. Ninguém da equipe precisa do seu acesso ao e-mail, ao banco ou à plataforma de jogo para ajudar."
                    },
                    {
                          "titulo": "Nunca envie os dados do cartão por mensagem",
                          "texto": "O pagamento é feito na própria loja, no navegador. Número de cartão, CVV e senha não são enviados por e-mail, WhatsApp ou chat."
                    },
                    {
                          "titulo": "Desconfie de links recebidos por mensagem",
                          "texto": "Ofertas de prêmio, desconto ou Afiliado urgente costumam levar a uma página que imita a loja. Na dúvida, digite o endereço da loja manualmente no navegador."
                    },
                    {
                          "titulo": "Para que a loja usa seus dados",
                          "texto": "Nome, e-mail, telefone e endereço de entrega são usados para processar o pedido e falar com você sobre ele. Eles não são publicados."
                    },
                    {
                          "titulo": "Se suspeitar de acesso indevido",
                          "texto": "Troque a senha imediatamente e avise a loja. Se você não reconhece a atividade, não compartilhe nenhum dado para \"confirmar\" a identidade."
                    }
              ]
        },
        {
              "id": "outros",
              "titulo": "Outras dúvidas",
              "resumo": "A pergunta não está nas outras categorias da Central de Ajuda.",
              "categoria": "outros",
              "termos": [
                    "outra",
                    "outro",
                    "duvida",
                    "pergunta",
                    "ajuda",
                    "atendimento",
                    "fale"
              ],
              "relacionados": [
                    "conta",
                    "pagamento",
                    "cancelamento"
              ],
              "solucoes": [
                    {
                          "titulo": "Use a pesquisa no topo da página",
                          "texto": "O campo de pesquisa procura ao mesmo tempo nos títulos, nas descrições e em todas as soluções. Escreva uma palavra só, como \"senha\" ou \"boleto\"."
                    },
                    {
                          "titulo": "Filtre por categoria",
                          "texto": "As categorias agrupam assuntos parecidos. Se a sua dúvida é de pagamento, escolha Pagamentos e veja todos os problemas daquele assunto."
                    },
                    {
                          "titulo": "Cada problema traz orientações relacionadas",
                          "texto": "No fim de cada problema há orientações próximas. Se nenhuma resolver, elas mostram por onde continuar antes de procurar atendimento."
                    },
                    {
                          "titulo": "Se nada resolver, fale com a loja",
                          "texto": "Ao final da página existe o botão de atendimento. Ele abre uma conversa já com o assunto escolhido, sem precisar explicar tudo de novo."
                    }
              ]
        }
  ],

    /* Nome legivel da categoria a partir do slug. */
    nomeDaCategoria: function (slug) {
      for (var i = 0; i < VH.ajuda.categorias.length; i += 1) {
        if (VH.ajuda.categorias[i].slug === slug) return VH.ajuda.categorias[i].nome;
      }
      return '';
    },

    /* Problemas de uma categoria. */
    porCategoria: function (slug) {
      return VH.ajuda.problemas.filter(function (p) { return p.categoria === slug; });
    },

    /* Busca por titulo, resumo e termos. */
    buscar: function (termo) {
      var alvo = String(termo || '').trim().toLowerCase();
      if (!alvo) return VH.ajuda.problemas;
      return VH.ajuda.problemas.filter(function (p) {
        var texto = [p.titulo, p.resumo].concat(p.termos).join(' ').toLowerCase();
        return texto.indexOf(alvo) !== -1;
      });
    }
  };
}(window));
