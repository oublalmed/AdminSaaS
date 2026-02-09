# AdminSaaS - Assistant Administratif & Financier IA

Plateforme SaaS B2B pour automatiser la gestion administrative et financiere des PME au Maroc et en Afrique francophone.

## Fonctionnalites

- **Auth & RBAC** - Inscription, connexion, roles (admin/employee/accountant)
- **Clients & KYC** - CRUD avec conformite marocaine (CIN, ICE, RC, IF)
- **Factures & Devis** - Creation manuelle ou generation IA, TVA automatique, export PDF
- **Documents & OCR** - Upload PDF/images, extraction OCR (Tesseract), classification IA
- **Relances automatiques** - Email/WhatsApp/SMS, redaction IA, cron jobs
- **Dashboard financier** - CA, impayes, cashflow, clients a risque
- **Assistant IA** - Chat conversationnel pour aide administrative

---

## Prerequis

| Outil | Version |
|-------|---------|
| Node.js | >= 18 |
| npm | >= 9 |
| MySQL | >= 8.0 |
| Docker (optionnel) | >= 20 |

---

## 1. Lancement rapide (Docker)

C'est la methode la plus simple. Tout est inclus.

```bash
# 1. Cloner le repo
git clone https://github.com/oublalmed/AdminSaaS.git
cd AdminSaaS

# 2. Configurer les variables d'environnement
cp .env.docker .env

# 3. Editer .env avec vos valeurs
#    - JWT_SECRET : generer avec: openssl rand -base64 32
#    - OPENAI_API_KEY : votre cle OpenAI (optionnel, le systeme fonctionne sans)
#    - MYSQL_PASSWORD : changer le mot de passe par defaut
nano .env

# 4. Lancer tous les services
docker-compose up -d

# 5. Attendre ~30s que MySQL demarre, puis verifier
docker-compose logs -f backend
```

L'application sera accessible sur :
- **Frontend** : http://localhost:3000
- **API** : http://localhost:3001/api
- **Swagger** : http://localhost:3001/api/docs (dev uniquement)
- **MinIO Console** : http://localhost:9001

### Compte demo

Pour creer les donnees de demo :

```bash
docker-compose exec backend npx ts-node prisma/seed.ts
```

Puis connectez-vous avec :
- **Email** : `admin@demo.ma`
- **Mot de passe** : `admin1234`

---

## 2. Lancement local (developpement)

### 2.1 Base de donnees

Option A - MySQL local :
```bash
# Installer MySQL et creer la base
mysql -u root -p -e "CREATE DATABASE admin_saas_db; CREATE USER 'admin_saas'@'localhost' IDENTIFIED BY 'password'; GRANT ALL ON admin_saas_db.* TO 'admin_saas'@'localhost';"
```

Option B - MySQL via Docker uniquement :
```bash
docker run -d --name adminsaas-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=admin_saas_db \
  -e MYSQL_USER=admin_saas \
  -e MYSQL_PASSWORD=password \
  -p 3306:3306 \
  mysql:8.0
```

### 2.2 Backend

```bash
cd backend

# Installer les dependances
npm install

# Configurer l'environnement
cp .env.example .env
# Editer .env avec votre DATABASE_URL et OPENAI_API_KEY
nano .env

# Generer le client Prisma
npx prisma generate

# Executer les migrations
npx prisma migrate dev --name init

# (Optionnel) Charger les donnees de demo
npx ts-node prisma/seed.ts

# Lancer le serveur de dev
npm run start:dev
```

Le backend tourne sur http://localhost:3001

### 2.3 Frontend

```bash
cd frontend

# Installer les dependances
npm install

# Configurer l'environnement
cp .env.example .env.local
# Par defaut pointe sur http://localhost:3001/api
nano .env.local

# Lancer le serveur de dev
npm run dev
```

Le frontend tourne sur http://localhost:3000

---

## 3. Deploiement en production

### 3.1 Serveur VPS (Ubuntu/Debian)

```bash
# 1. Installer Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Cloner et configurer
git clone https://github.com/oublalmed/AdminSaaS.git
cd AdminSaaS
cp .env.docker .env

# 3. Configurer les secrets de production
nano .env
```

**Variables critiques a changer :**

```env
# Generer un secret fort
JWT_SECRET=votre-secret-genere-avec-openssl-rand-base64-32

# Mots de passe MySQL forts
MYSQL_ROOT_PASSWORD=mot-de-passe-fort-root
MYSQL_PASSWORD=mot-de-passe-fort-app

# MinIO
MINIO_ROOT_PASSWORD=mot-de-passe-fort-minio

# URLs de production
APP_URL=https://api.votredomaine.com
FRONTEND_URL=https://votredomaine.com
NEXT_PUBLIC_API_URL=https://api.votredomaine.com/api

# OpenAI (optionnel)
OPENAI_API_KEY=sk-votre-cle

# SMTP pour les relances email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-application

NODE_ENV=production
```

```bash
# 4. Construire et lancer
docker-compose up -d --build

# 5. Verifier que tout fonctionne
docker-compose ps
docker-compose logs -f

# 6. Initialiser les donnees demo (optionnel)
docker-compose exec backend npx ts-node prisma/seed.ts
```

### 3.2 Reverse proxy Nginx (HTTPS)

Installez Nginx + Certbot pour le SSL :

```bash
sudo apt install nginx certbot python3-certbot-nginx
```

Configuration Nginx (`/etc/nginx/sites-available/adminsaas`) :

```nginx
server {
    server_name votredomaine.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    server_name api.votredomaine.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/adminsaas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Installer le certificat SSL
sudo certbot --nginx -d votredomaine.com -d api.votredomaine.com
```

### 3.3 Sauvegardes automatiques

```bash
# Sauvegarde MySQL quotidienne
echo '0 2 * * * docker-compose exec -T mysql mysqldump -u admin_saas -ppassword admin_saas_db | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz' | crontab -
```

---

## 4. API Reference

| Methode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/api/health` | Non | Health check |
| `POST` | `/api/auth/register` | Non | Inscription entreprise |
| `POST` | `/api/auth/login` | Non | Connexion |
| `GET` | `/api/auth/profile` | Oui | Profil utilisateur |
| `POST` | `/api/auth/users` | Admin | Ajouter un utilisateur |
| `GET` | `/api/clients` | Oui | Lister les clients (pagine) |
| `POST` | `/api/clients` | Oui | Creer un client |
| `GET` | `/api/clients/:id` | Oui | Detail client + historique |
| `PUT` | `/api/clients/:id` | Oui | Modifier un client |
| `DELETE` | `/api/clients/:id` | Oui | Supprimer un client |
| `GET` | `/api/invoices` | Oui | Lister les factures (pagine) |
| `POST` | `/api/invoices` | Oui | Creer une facture |
| `GET` | `/api/invoices/:id` | Oui | Detail facture |
| `GET` | `/api/invoices/:id/pdf` | Oui | Telecharger PDF |
| `PUT` | `/api/invoices/:id` | Oui | Modifier une facture |
| `POST` | `/api/invoices/ai-generate` | Oui | Generation IA facture |
| `GET` | `/api/quotes` | Oui | Lister les devis (pagine) |
| `POST` | `/api/quotes` | Oui | Creer un devis |
| `POST` | `/api/documents/upload` | Oui | Upload + OCR auto |
| `GET` | `/api/documents` | Oui | Lister les documents |
| `GET` | `/api/reminders` | Oui | Lister les relances |
| `POST` | `/api/reminders/ai-generate` | Oui | Relance IA |
| `GET` | `/api/dashboard/finance` | Oui | Dashboard financier |
| `POST` | `/api/ai/chat` | Oui | Chat avec l'assistant IA |

**Pagination** : Ajouter `?page=1&limit=20` aux endpoints listes.

**Authentification** : Header `Authorization: Bearer <token>`

---

## 5. Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | MySQL 8.0 |
| Storage | MinIO (S3-compatible) |
| OCR | Tesseract.js (fra + ara + eng) |
| AI | OpenAI API (gpt-4o-mini) |
| Auth | JWT + RBAC |
| PDF | PDFKit |
| Deploy | Docker, docker-compose |

---

## 6. Structure du projet

```
AdminSaaS/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Schema DB (7 modeles)
│   │   └── seed.ts              # Donnees demo
│   ├── src/
│   │   ├── auth/                # JWT, register, login, RBAC
│   │   ├── clients/             # CRUD + KYC (ICE, CIN, RC)
│   │   ├── invoices/            # Factures, devis, PDF, IA
│   │   ├── documents/           # Upload, OCR, classification IA
│   │   ├── reminders/           # Relances auto, cron, IA
│   │   ├── dashboard/           # Stats financieres
│   │   ├── ai/                  # Chat IA, generation
│   │   └── common/              # Guards, decorators, filters
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/            # Login, register
│   │   │   └── dashboard/       # Toutes les pages
│   │   ├── components/          # Layout, UI (Toast, Pagination)
│   │   ├── hooks/               # useAuth
│   │   ├── lib/                 # API client
│   │   └── types/               # TypeScript interfaces
│   └── Dockerfile
├── docker-compose.yml
└── .env.docker                  # Template variables production
```

---

## 7. Conformite Maroc & Afrique

- **ICE** : Identifiant Commun de l'Entreprise (validation 15 chiffres)
- **RC** : Registre de Commerce
- **CIN** : Carte d'Identite Nationale (validation format AB123456)
- **IF** : Identifiant Fiscal
- **TVA** : Taux par defaut 20% (configurable par tenant)
- **Devise** : MAD par defaut (configurable)
- **Pays** : MA, SN, CI, TN, DZ, CM, GA, ML, BF
