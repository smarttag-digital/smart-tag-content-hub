# SMAR TAG Content Hub

Crie uma aplicação web completa chamada SMART TAG CONTENT HUB, um portal profissional de seleção e aprovação de vídeos para clientes da agência SMAR TAG.

IMPORTANTE:

Não criar apenas uma landing page ou protótipo visual.

Criar uma aplicação funcional, responsiva e pronta para uso.

A interface deve ter aparência de produto SaaS premium.

O sistema precisa funcionar em desktop, tablet e celular.

Priorizar UX/UI profissional, simples e intuitiva.

Todos os textos da interface devem estar em português do Brasil.

Usar formato de data brasileiro.

Não utilizar textos genéricos como "Lorem ipsum".

Não criar funcionalidades falsas que aparentem funcionar.

Sempre que uma ação for exibida como disponível, ela deve funcionar.

==================================================

OBJETIVO DO SISTEMA
==================================================

O SMART TAG CONTENT HUB será utilizado pela agência SMAR TAG para disponibilizar vídeos aos clientes.

Fluxo principal:

A SMAR TAG cadastra um cliente.

A SMAR TAG cria uma campanha/período.

A SMAR TAG faz upload dos vídeos.

Cada vídeo recebe título, descrição, categoria e thumbnail.

O cliente acessa um link privado.

O cliente visualiza os vídeos.

O cliente seleciona os vídeos que deseja receber.

O cliente pode visualizar sua seleção.

O cliente confirma a seleção.

A agência recebe essa seleção no painel administrativo.

A agência altera o status dos vídeos selecionados para "Em preparação" e posteriormente "Enviado".

O objetivo é substituir o envio desorganizado de vídeos pelo WhatsApp/Google Drive por uma experiência profissional de aprovação de conteúdo.

==================================================
2. IDENTIDADE VISUAL

Marca:
SMAR TAG

Produto:
CONTENT HUB

Criar uma identidade visual premium, moderna e minimalista.

Estética:

Agência de marketing digital premium

SaaS moderno

Editorial

Clean

Sofisticado

Muito espaço em branco

Cards com bordas sutis

Cantos levemente arredondados

Tipografia moderna

Hierarquia visual forte

Microinterações discretas

Animações suaves

Evitar:

Visual infantil

Excesso de gradientes

Excesso de sombras

Visual genérico de template

Aparência de sistema administrativo antigo

Utilizar a identidade visual da SMAR TAG de forma elegante.

Criar suporte para:

Logo da SMAR TAG

Cor principal configurável

Nome da agência

Nome do cliente

==================================================
3. ESTRUTURA DE ACESSO

Existem dois tipos de usuários:

ADMIN

Agência SMAR TAG

Pode gerenciar clientes

Pode criar campanhas

Pode fazer upload de vídeos

Pode editar vídeos

Pode excluir vídeos

Pode acompanhar seleções

Pode alterar status

Pode visualizar histórico

CLIENTE

Não possui acesso ao painel administrativo.

Acessa somente seu portal privado.

Pode visualizar os vídeos disponibilizados para ele.

Pode selecionar vídeos.

Pode retirar vídeos da seleção antes da confirmação.

Pode confirmar a seleção.

Depois da confirmação, a seleção fica registrada.

Criar autenticação segura.

Para o MVP, permitir que o administrador gere um link privado para cada campanha.

Exemplo:

/cliente/{slug-da-campanha}

O link deve funcionar somente para a campanha correspondente.

==================================================
4. PAINEL ADMINISTRATIVO

Criar uma sidebar lateral com:

Dashboard
Clientes
Campanhas
Vídeos
Seleções
Configurações

No topo:

Logo SMAR TAG

Nome do usuário

Menu de perfil

==================================================
5. DASHBOARD ADMINISTRATIVO

Criar dashboard com indicadores:

Clientes ativos
Campanhas ativas
Vídeos publicados
Vídeos selecionados
Vídeos aguardando envio

Criar seção:

"Últimas atividades"

Exemplos:

Cliente X selecionou 4 vídeos
Campanha Agosto 2026 recebeu uma nova seleção
Vídeo "Tour apartamento" foi enviado
Cliente Y acessou sua campanha

Criar também uma seção:

"Campanhas recentes"

Cada campanha deve mostrar:

Nome
Cliente
Período
Quantidade de vídeos
Quantidade selecionada
Status

==================================================
6. CLIENTES

Criar CRUD completo de clientes.

Campos:

Nome da empresa
Nome do responsável
E-mail
Telefone
Logo
Slug
Status
Observações

Status:

Ativo
Inativo

Na listagem mostrar:

Cliente
Responsável
Campanhas
Última atividade
Status

Botões:

Visualizar
Editar
Excluir
Criar campanha

==================================================
7. CAMPANHAS

Criar CRUD completo de campanhas.

Campos:

Nome da campanha
Cliente
Descrição
Data inicial
Data final
Status
Slug único

Status:

Rascunho
Publicada
Encerrada

Exemplo:

"Conteúdos Agosto 2026"

Dentro da campanha mostrar:

Informações da campanha
Vídeos
Seleções
Link do cliente

Criar botão:

"COPIAR LINK DO CLIENTE"

Ao clicar:

copiar o link

mostrar toast "Link copiado!"

Criar botão:

"ABRIR PORTAL DO CLIENTE"

==================================================
8. UPLOAD DE VÍDEOS

Criar sistema real de upload.

Permitir upload de vídeos.

Formatos aceitos:

MP4
MOV
WEBM

Mostrar limite de tamanho configurável.

Ao fazer upload, criar registro no banco.

Campos do vídeo:

Título
Descrição
Arquivo
Thumbnail
Categoria
Duração
Campanha
Ordem
Status

Categorias:

Reels
Stories
Anúncio
Institucional
Outro

Status:

Aguardando escolha
Selecionado
Em preparação
Enviado

Permitir alterar a ordem dos vídeos.

Permitir drag and drop.

==================================================
9. THUMBNAILS

Cada vídeo deve ter thumbnail.

Permitir:

Upload manual da thumbnail.

Caso nenhuma thumbnail seja enviada, utilizar automaticamente o primeiro frame do vídeo quando possível.

A thumbnail deve aparecer na galeria do cliente.

Não mostrar uma galeria apenas com players vazios.

==================================================
10. PORTAL DO CLIENTE

Essa é a parte MAIS IMPORTANTE do projeto.

Criar uma página extremamente bonita e profissional.

Header:

SMAR TAG
CONTENT HUB

Texto:

"Conteúdos preparados para você"

Mostrar:

Olá, [Nome do cliente]

"Selecionamos estes conteúdos para sua avaliação. Assista aos vídeos e escolha aqueles que deseja receber."

Mostrar:

[12] conteúdos disponíveis
[4] selecionados

==================================================
11. FILTROS

Criar filtros:

Todos
Reels
Stories
Anúncios
Institucional

Criar busca:

"Buscar conteúdo..."

Criar filtro por status:

Todos
Selecionados
Não selecionados

==================================================
12. GALERIA DE VÍDEOS

Criar grid responsivo.

Desktop:
3 cards por linha.

Tablet:
2 cards.

Mobile:
1 card.

Cada card deve mostrar:

Thumbnail
Número do vídeo
Título
Categoria
Duração
Botão "Assistir"
Checkbox ou botão de seleção

Exemplo:

01

3 ERROS QUE FAZEM SEU IMÓVEL FICAR PARADO

REELS
00:37

[Assistir]

[Selecionar vídeo]

Quando selecionado:

✓ Selecionado

O card deve receber destaque visual.

Não reproduzir todos os vídeos automaticamente.

==================================================
13. PLAYER DE VÍDEO

Ao clicar em "Assistir", abrir um modal.

Modal grande e responsivo.

Mostrar:

Thumbnail/vídeo
Título
Descrição
Categoria
Duração

Botão:

"Selecionar vídeo"

ou

"Remover da seleção"

Permitir assistir o vídeo sem sair da página.

Utilizar controles de vídeo.

Não permitir download diretamente pelo player na primeira versão.

==================================================
14. BARRA DE SELEÇÃO

Criar uma barra fixa na parte inferior da tela do cliente quando houver vídeos selecionados.

Exemplo:

"4 vídeos selecionados"

[REVISAR SELEÇÃO]

A barra deve aparecer somente quando houver pelo menos um vídeo selecionado.

==================================================
15. REVISÃO DA SELEÇÃO

Criar tela/modal:

"Revise sua seleção"

Mostrar os vídeos escolhidos.

Cada item:

Thumbnail
Título
Categoria
Botão remover

Mostrar:

Total de vídeos selecionados

Botão:

"CONFIRMAR SELEÇÃO"

Antes da confirmação, mostrar confirmação:

"Tem certeza que deseja confirmar sua seleção?"

"Após confirmar, sua seleção será enviada para a equipe SMAR TAG."

Botões:

Voltar
Confirmar seleção

==================================================
16. CONFIRMAÇÃO

Depois da confirmação, salvar:

Data
Hora
Cliente
Campanha
Vídeos selecionados

Alterar o status da seleção para:

"Confirmada"

Mostrar página:

"Seleção enviada com sucesso!"

Texto:

"Recebemos sua seleção. A equipe SMAR TAG irá preparar os conteúdos escolhidos."

Mostrar:

X vídeos selecionados

Botão:

"Voltar para conteúdos"

==================================================
17. IMPORTANTE: BLOQUEIO APÓS CONFIRMAÇÃO

Depois que o cliente confirmar a seleção:

Não permitir alterar a seleção diretamente.

Mostrar aviso:

"Seleção confirmada"

Caso seja necessário fazer alterações, mostrar:

"Precisa alterar sua seleção?"

"Entre em contato com a equipe SMAR TAG."

No painel administrativo, permitir que o administrador reabra a seleção.

==================================================
18. SELEÇÕES NO ADMIN

Criar página:

"Seleções"

Mostrar:

Cliente
Campanha
Quantidade de vídeos
Data da seleção
Status

Status:

Aguardando
Confirmada
Em preparação
Enviada

Ao abrir uma seleção:

Mostrar todos os vídeos escolhidos.

Permitir alterar status individualmente.

Exemplo:

Vídeo 01
✓ Selecionado
[Em preparação]

Vídeo 02
✓ Selecionado
[Enviado]

==================================================
19. STATUS DOS VÍDEOS

Cada vídeo deve ter status:

AGUARDANDO ESCOLHA

SELECIONADO

EM PREPARAÇÃO

ENVIADO

Usar badges visuais elegantes.

Regra:

Quando o cliente selecionar:
Aguardando escolha → Selecionado

Quando a agência iniciar preparação:
Selecionado → Em preparação

Quando a agência enviar:
Em preparação → Enviado

==================================================
20. COMENTÁRIOS / OBSERVAÇÕES

No modal do vídeo, permitir que o cliente deixe uma observação opcional.

Campo:

"Quer deixar alguma observação sobre este conteúdo?"

Exemplo:

"Gostaria de alterar a música."

Salvar a observação vinculada ao vídeo e à seleção.

No painel administrativo, mostrar essas observações.

==================================================
21. HISTÓRICO

Criar sistema de atividades.

Registrar:

Cliente acessou campanha
Cliente visualizou vídeo
Cliente selecionou vídeo
Cliente removeu vídeo da seleção
Cliente confirmou seleção
Administrador alterou status
Administrador reabriu seleção

Mostrar data e hora.

==================================================
22. BANCO DE DADOS

Utilizar Supabase.

Criar estrutura relacional adequada.

Tabelas:

users
clients
campaigns
videos
selections
selection_items
video_comments
activity_logs

Relacionamentos:

clients
→ campaigns

campaigns
→ videos

campaigns
→ selections

selections
→ selection_items

selection_items
→ videos

users
→ activity_logs

Criar Row Level Security (RLS).

Cliente somente pode acessar seus próprios conteúdos.

Administrador pode acessar todos os dados.

Não expor arquivos ou dados de outros clientes.

==================================================
23. STORAGE

Utilizar Supabase Storage para armazenar:

Vídeos
Thumbnails
Logos

Criar buckets separados quando apropriado.

Exemplo:

videos
thumbnails
logos

As URLs dos arquivos devem ser armazenadas no banco.

Priorizar segurança e URLs assinadas quando necessário.

==================================================
24. RESPONSIVIDADE

O portal do cliente deve funcionar perfeitamente em:

Desktop
Notebook
Tablet
Celular

No celular:

Grid de 1 coluna.

Player responsivo.

Barra de seleção adaptada.

Botões grandes o suficiente para toque.

Navegação simples.

==================================================
25. UX

Criar estados:

Loading
Empty state
Error
Success

Exemplo quando não houver vídeos:

"Não há conteúdos disponíveis nesta campanha."

Exemplo quando não houver seleção:

"Você ainda não selecionou nenhum conteúdo."

Criar Toasts para ações:

"Vídeo selecionado"
"Vídeo removido"
"Seleção confirmada"
"Link copiado"

Usar skeleton loading durante carregamentos.

==================================================
26. SEGURANÇA

Implementar:

RLS no Supabase
Validação de permissões
Links de campanha com slug/token único
Proteção contra acesso de um cliente aos dados de outro
Validação de upload
Limite de tamanho dos arquivos
Validação de formatos

Não colocar credenciais ou chaves privadas no frontend.

==================================================
27. CONFIGURAÇÕES

Criar página de configurações.

Campos:

Nome da agência
Logo
E-mail
Telefone
Cor principal
Mensagem padrão do portal

Permitir personalização básica do portal.

==================================================
28. E-MAIL / NOTIFICAÇÕES

Preparar a arquitetura para notificações futuras.

Quando o cliente confirmar uma seleção:

Criar evento:

selection_confirmed

Deixar a estrutura preparada para futuramente enviar e-mail ou WhatsApp.

Por enquanto, garantir que a confirmação seja registrada corretamente no banco.

==================================================
29. DESIGN DOS CARDS

Os cards dos vídeos devem ser o destaque visual.

Thumbnail grande.

Overlay discreto com botão de play.

Ao passar o mouse:

pequena animação

botão assistir aparece

card eleva levemente

Ao selecionar:

destaque visual

ícone de check

texto "Selecionado"

No mobile, manter tudo simples sem depender de hover.

==================================================
30. PÁGINA DE LOGIN ADMIN

Criar login profissional.

Logo SMAR TAG

"Content Hub"

Campos:

E-mail
Senha

Botão:

"Entrar"

Link:

"Esqueci minha senha"

Após login:

Dashboard.

==================================================
31. EMPTY STATES

Criar estados vazios elegantes.

Clientes:

"Nenhum cliente cadastrado."

Botão:
"+ Novo cliente"

Campanhas:

"Nenhuma campanha criada."

Botão:
"+ Nova campanha"

Vídeos:

"Nenhum vídeo adicionado."

Botão:
"+ Adicionar vídeo"

Seleções:

"Nenhuma seleção recebida."

==================================================
32. DASHBOARD VISUAL

O dashboard administrativo deve parecer uma ferramenta SaaS real.

Cards de KPI:

CLIENTES
12

CAMPANHAS ATIVAS
8

VÍDEOS PUBLICADOS
146

SELEÇÕES PENDENTES
5

Abaixo:

"Atividade recente"

e

"Campanhas"

==================================================
33. PERFORMANCE

Como vídeos podem ser arquivos pesados:

Utilizar upload com progresso.

Mostrar percentual de upload.

Evitar carregar todos os vídeos simultaneamente.

Utilizar thumbnails.

Lazy loading.

Não carregar o arquivo completo antes do usuário abrir o vídeo.

Otimizar consultas ao Supabase.

==================================================
34. ESTRUTURA DE ROTAS

Criar rotas semelhantes a:

/login
/dashboard
/clientes
/clientes/:id
/campanhas
/campanhas/:id
/campanhas/:id/videos
/selecoes
/selecoes/:id
/configuracoes

Portal público/privado do cliente:

/portal/:slug

==================================================
35. BOTÕES PRINCIPAIS

Usar textos claros.

Admin:

Novo cliente

Nova campanha

Adicionar vídeo
Editar
Excluir
Visualizar
Copiar link
Abrir portal
Reabrir seleção
Alterar status

Cliente:

Assistir
Selecionar vídeo
Remover seleção
Revisar seleção
Confirmar seleção

==================================================
36. EXPERIÊNCIA FINAL DO CLIENTE

A experiência deve parecer:

"Recebi acesso a uma plataforma exclusiva da agência."

Não deve parecer:

"Recebi uma pasta de vídeos."

O portal deve transmitir organização, exclusividade, tecnologia e profissionalismo.

==================================================
37. MICROCOPY

Usar linguagem profissional, mas humana.

Exemplo de header:

"Conteúdos preparados para sua marca."

Texto:

"Assista aos conteúdos abaixo e selecione os vídeos que deseja receber."

Botão:

"Selecionar vídeo"

Após seleção:

"Adicionado à sua seleção"

Após confirmação:

"Seleção enviada com sucesso."

==================================================
38. IMPLEMENTAÇÃO

Antes de finalizar:

Criar banco Supabase.

Criar tabelas.

Criar relacionamentos.

Criar RLS.

Criar autenticação.

Criar Storage.

Criar upload.

Criar CRUD.

Criar portal do cliente.

Criar seleção.

Criar confirmação.

Criar histórico.

Criar dashboard.

Testar responsividade.

Testar fluxo completo.

Fluxo obrigatório para testar:

ADMIN
→ cria cliente
→ cria campanha
→ adiciona vídeo
→ publica campanha
→ copia link

CLIENTE
→ acessa link
→ visualiza vídeo
→ seleciona 2 vídeos
→ revisa
→ confirma

ADMIN
→ visualiza seleção
→ altera status
→ visualiza histórico

Não considerar o projeto concluído apenas porque a interface foi criada.

O sistema deve ter o fluxo funcional de ponta a ponta.

==================================================
39. PRIORIDADE

Prioridade máxima:

Portal do cliente

Upload de vídeos

Seleção de vídeos

Confirmação

Dashboard administrativo

Clientes

Campanhas

Status

Histórico

Configurações

Criar primeiro uma versão funcional e estável dessas funcionalidades antes de adicionar recursos secundários.

O resultado final deve ser um Content Hub profissional da SMAR TAG, pronto para ser utilizado com clientes reais.

IDENTIDADE VISUAL OBRIGATÓRIA

Utilizar a identidade visual do SmartFlow Agenda fornecida pela SMAR TAG.

Paleta principal:

 Azul elétrico: #0589F4

 Azul royal: #195FE2

 Azul-violeta: #5D4EE2

 Violeta: #8853E9

 Roxo profundo: #7F30C8

 Preto roxo: #0A000F

 Roxo escuro: #1D0039

 Branco: #FFFFFF

 Cinza secundário: #A9A4B5

A linguagem visual deve utilizar principalmente fundos escuros e gradientes azul → violeta → roxo.

Não utilizar verde-lima, amarelo, laranja ou outras cores como cores principais.

O gradiente azul-violeta deve ser utilizado de forma estratégica em CTAs, estados ativos, ícones, indicadores e elementos de destaque.

A interface deve transmitir tecnologia, exclusividade, sofisticação e inovação, seguindo a estética do logo SmartFlow Agenda fornecido pela SMAR TAG.

estou enviado a logo da smar tag tbm,

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://smart-tag-content-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/75bc4187-7f48-445a-8275-d8efefa31e6f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
