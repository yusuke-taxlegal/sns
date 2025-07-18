# GitHubとNetlifyによるデプロイ自動化ガイド

ローカルで修正したHTMLファイルを、簡単なコマンド一つで自動的にNetlify上のウェブサイトに反映させるための手順書。

---

### 全体の流れ

1.  **準備：** 必要なツール（Git）を準備し、GitHubアカウントを作成する。
2.  **ローカル設定：** PC内の提案資料フォルダをGitで管理できるようにする。
3.  **GitHubへ保存：** ローカルのフォルダをGitHubにアップロードする。
4.  **Netlifyと連携：** GitHub上のフォルダをNetlifyに接続し、最初のサイトを公開する。
5.  **自動化の体験：** ローカルでファイルを修正し、コマンド一つでサイトが自動更新されることを確認する。

---

### ステップ1：準備

1.  **Gitのインストール：** [公式サイト](https://git-scm.com/downloads)からダウンロードしてインストールする。
2.  **GitHubアカウント作成：** [GitHub公式サイト](https://github.com/)で無料アカウントを作成する。

---

### ステップ2：ローカルの提案資料フォルダをGitで管理する

ターミナルを開き、作業フォルダ（例：`★Obsidian`）に移動してから、以下のコマンドを実行する。

1.  **Gitリポジトリの初期化:**
    ```bash
    git init
    ```
    （フォルダ内に`.git`という管理用隠しフォルダが作成される）

2.  **最初の状態を記録:**
    ```bash
    git add .
    git commit -m "Initial commit"
    ```
    （現在のフォルダ全体を「最初のバージョン」として記録する）

---

### ステップ3：GitHubにリポジトリを作成し、ローカルと接続

1.  **GitHubで新しいリポジトリを作成:**
    - GitHubにログインし、`New repository` を選択。
    - `Repository name`: `proposal-archive`など分かりやすい名前を入力。
    - `Private`（非公開）を選択。
    - `Create repository` をクリック。

2.  **ローカルリポジトリと接続:**
    - リポジトリ作成後の画面に表示される以下のコマンドを実行。（URLは自身のものに置き換える）
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/proposal-archive.git
    git branch -M main  # ブランチ名をmainに変更（推奨）
    git push -u origin main
    ```
    （ローカルのフォルダの内容がGitHubにアップロードされる）

---

### ステップ4：NetlifyとGitHubを連携させる

1.  **Netlifyでサイト作成:**
    - [Netlify](https://www.netlify.com/)にログイン。
    - 「Add new site」→「Import an existing project」を選択。
    - 「Deploy with GitHub」を選び、GitHubアカウントと連携認証。
    - 作成した `proposal-archive` リポジトリを選択。

2.  **デプロイ設定（案件ごとの設定）:**
    - **Base directory**: 公開したい案件のフォルダパスを入力。
        - 例： `提案資料/夢Walk/現状と予約業務の効率化`
    - **Build command**: （空欄のままでOK）
    - **Publish directory**: `Base directory` と同じパスを入力。
        - 例： `提案資料/夢Walk/現状と予約業務の効率化`
    - 「Deploy site」をクリック。

これで指定したフォルダの`index.html`が公開される。サイト名はNetlifyの設定で自由に変更可能。

---

### ステップ5：更新フローの自動化

今後は、ローカルでファイルを編集した後、ターミナルで以下の3つのコマンドを実行するだけでサイトが更新される。

```bash
# 1. 変更されたファイルを全てステージング
git add .

# 2. 変更内容を記録（メッセージは分かりやすく）
git commit -m "〇〇の資料を修正"

# 3. GitHubにプッシュ
git push origin main
```

`push`が完了すると、Netlifyが自動で変更を検知し、数分以内にウェブサイトを最新の状態に更新する。**ドラッグ＆ドロップは不要になる。**

---

### 新しい案件を追加する場合

1.  ローカルに新しい案件のフォルダとファイルを作成（例：`提案資料/C社/新規提案/index.html`）。
2.  **ステップ5**の手順で、変更をGitHubに`push`する。
3.  Netlifyの管理画面で、再度「Add new site」から同じリポジトリを選択し、**ステップ4**のデプロイ設定を繰り返す。この時`Base directory`に新しいフォルダパスを指定する。

これにより、1つのGitHubリポジトリで、複数の案件サイトを独立して管理・公開できる。 