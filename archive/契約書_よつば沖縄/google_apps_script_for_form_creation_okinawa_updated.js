// 【要設定】ご自身の環境に合わせてID等を設定してください
const SPREADSHEET_ID = '1tAwk9sysJyi8sUJ496Ks2K3rjNxcU3-YdUypjWqR2LI';
const SHEET_NAME = 'フォームの回答 1'; // 回答が記録されるシート名
const ADMIN_EMAIL = 'tamashiro@taxlegal.jp'; // エラー通知を受け取る管理者メールアドレス

// 列の番号を指定（A列が1、B列が2...）
const EMAIL_COLUMN = 2; // メールアドレスが入力されている列
const CONFIRM_ID_COLUMN = 8; // 確認IDを記録する列 (H列)
const STATUS_COLUMN = 9;   // 本人確認ステータスを記録する列 (I列)
const STAMP_COLUMN = 10;     // 電子印鑑画像のURLを記録する列 (J列)

/**
 * ▼ 機能1：フォーム送信時に起動する関数 ▼
 * 確認IDの発行、ステータスの記録、本人確認メールの送信を行います。
 */
function onFormSubmitTrigger(e) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const range = e.range; // イベントオブジェクトから編集されたセルの範囲を取得
    const row = range.getRow();
    const itemResponses = e.namedValues;
    
    // メールアドレスを取得（フォームの質問名と一致させる）
    const recipientEmail = itemResponses['メールアドレス'][0];
    if (!recipientEmail) {
      Logger.log('メールアドレスが取得できませんでした。');
      return;
    }

    // 1. ユニークな確認IDを生成し、シートに書き込む
    const confirmId = Utilities.getUuid();
    sheet.getRange(row, CONFIRM_ID_COLUMN).setValue(confirmId);

    // 2. 本人確認ステータスを「未確認」として記録
    sheet.getRange(row, STATUS_COLUMN).setValue('未確認');
    
    // 3. WebアプリケーションのURLを直接指定して確認リンクを作成
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwu0m5vFBCG2R8AAQdMSevpkewipVJ6le9SwM3AbJZG_GZKrSarFWbSMTjV2Ps4nGf3/exec'; // 「デプロイを管理」からコピーした固定URL
    const verificationLink = `${WEB_APP_URL}?id=${confirmId}`;

    // 4. 本人確認メールを送信
    const subject = '【要確認】お申し込みありがとうございます';
    const body = `
この度は、業務委託契約のお申し込み、誠にありがとうございます。

まだお申し込みは完了しておりません。
お手数ですが、以下のリンクをクリックして、メールアドレスの本人確認を完了してください。

▼本人確認用リンク（24時間有効）
${verificationLink}

---
※このメールはシステムにより自動送信されています。
※このメールにお心当たりがない場合は、お手数ですが、メールを破棄していただきますようお願いいたします。
`;

    const options = {
      name: 'T&Lサポート株式会社'
    };

    MailApp.sendEmail(recipientEmail, subject, body, options);
    Logger.log('本人確認メールを送信しました: ' + recipientEmail);

  } catch (error) {
    Logger.log('エラーが発生しました: ' + error.toString());
    MailApp.sendEmail(ADMIN_EMAIL, '【GASエラー】契約フォームでエラーが発生しました', error.toString());
  }
}


/**
 * ▼ 機能2：確認リンクがクリックされた時に起動するWebアプリの関数 ▼
 * URLのIDを元にスプレッドシートのステータスを「確認済み」に更新します。
 * 【変更点】完了ページとエラーページの見た目を改善しました。
 */
function doGet(e) {
  try {
    const confirmId = e.parameter.id;
    if (!confirmId) {
      return createHtmlResponse('エラー', '無効なリンクです。', true);
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    let targetRow = -1;
    let currentStatus = '';

    // スプレッドシートを検索して該当の確認IDを探す
    for (let i = 1; i < data.length; i++) { // 1行目はヘッダーなのでスキップ
      if (data[i][CONFIRM_ID_COLUMN - 1] === confirmId) {
        targetRow = i + 1;
        currentStatus = data[i][STATUS_COLUMN - 1];
        break;
      }
    }

    if (targetRow !== -1) {
      if (currentStatus === '確認済み') {
        Logger.log('既に確認済みのリンクがクリックされました: ' + confirmId);
        return createHtmlResponse('手続き完了済み', 'このメールアドレスの確認は既に完了しています。', false);
      }
      
      // 該当行のステータスを「確認済み」に更新
      sheet.getRange(targetRow, STATUS_COLUMN).setValue('確認済み');
      
      // J列に電子印鑑画像のURLを書き込む
      const stampUrl = 'https://drive.google.com/uc?export=view&id=1Yfx3wPgnRq5vq3GlbGC_MN0l-VgQ-ACO';
      sheet.getRange(targetRow, STAMP_COLUMN).setValue(stampUrl);

      // 使用済みのIDをクリア（任意ですがセキュリティ向上）
      // sheet.getRange(targetRow, CONFIRM_ID_COLUMN).setValue(''); 
      Logger.log('ステータスを更新しました: ' + confirmId);
      
      // 申込者にデザインされた完了ページを表示
      return createHtmlResponse(
        '✔ 確認が完了しました', 
        'ご登録いただいたメールアドレスの確認が完了しました。ありがとうございます。<br>正式な書類PDFは、まもなく自動で作成され、ご登録のメールアドレスに送信されます。',
        false
      );
    } else {
      Logger.log('無効なIDが指定されました: ' + confirmId);
      return createHtmlResponse('エラー', '無効または期限切れのリンクです。', true);
    }
  } catch (error) {
    Logger.log('doGetエラー: ' + error.toString());
    MailApp.sendEmail(ADMIN_EMAIL, '【GASエラー】Webアプリでエラーが発生しました', error.toString());
    return createHtmlResponse('システムエラー', '処理中に問題が発生しました。管理者にお問い合わせください。', true);
  }
}

/**
 * ▼ 補助関数：レスポンス用のHTMLを生成する関数 ▼
 */
function createHtmlResponse(title, message, isError) {
  const themeColor = isError ? '#dc3545' : '#28a745'; // エラー時は赤、成功時は緑
  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; text-align: center; padding: 40px 20px; background-color: #f8f9fa; color: #333; }
          .container { background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); display: inline-block; max-width: 600px; border-top: 5px solid ${themeColor}; }
          h1 { color: ${themeColor}; }
          p { font-size: 1.1em; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${title}</h1>
          <p>${message}</p>
        </div>
      </body>
    </html>
  `;
  return HtmlService.createHtmlOutput(html).setTitle(title);
} 