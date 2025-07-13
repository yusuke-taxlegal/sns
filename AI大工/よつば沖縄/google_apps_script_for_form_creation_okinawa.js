/**
 * このスクリプトは、Googleスプレッドシートのセミナー情報から、
 * ワンクリックでGoogleフォームの申込フォームを自動生成します。（沖縄版）
 * 【使い方】
 * 1. スプレッドシートにこのスクリプトを登録します（初回のみ）。
 * 2. 情報を入力した行を選択し、上部メニューの「フォーム自動作成」 > 「選択行から申込フォームを作成」をクリックします。
 * 3. 自動でフォームが作成され、Q列にURLが入力されます。
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('フォーム自動作成')
      .addItem('選択行から申込フォームを作成', 'createOkinawaForm')
      .addToUi();
}

function createOkinawaForm() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  const activeRow = sheet.getActiveRange().getRow();

  if (activeRow === 1) {
    ui.alert('ヘッダー行（1行目）は選択できません。');
    return;
  }

  // Q列（17列目）に既にURLがあるか確認
  const formUrlCell = sheet.getRange(activeRow, 17);
  if (formUrlCell.getValue() !== '') {
    const response = ui.alert('既にURLが入力されています。新しいフォームを作成して上書きしますか？', ui.ButtonSet.YES_NO);
    if (response !== ui.Button.YES) {
      ui.alert('処理を中断しました。');
      return;
    }
  }

  // 行から情報を取得 (A列からP列まで)
  const rowData = sheet.getRange(activeRow, 1, 1, 16).getValues()[0]; 
  const seminarId = rowData[0];      // A列: 開催回
  const seminarTheme = rowData[1];   // B列: テーマ
  const seminarDate = rowData[2];    // C列: 開催日
  const seminarTime = rowData[4];    // E列: セミナー時間
  const konshinkaiTime = rowData[5]; // F列: 懇親会開始
  const seminarVenue = rowData[6];   // G列: セミナー会場名
  const paymentMethod = rowData[10]; // K列: 支払方法
  const konshinkaiFee = rowData[11]; // L列: 懇親会会費
  const konshinkaiVenue = rowData[13];// N列: 懇親会会場名

  if (!seminarId || !seminarTheme || !seminarDate) {
    ui.alert('フォーム作成に必須の情報（A列: 開催回, B列: テーマ, C列: 開催日）が入力されていません。');
    return;
  }

  try {
    const formTitle = `第${seminarId}回 よつばセミナー in 沖縄 お申込みフォーム`;
    
    const formattedDate = Utilities.formatDate(new Date(seminarDate), SpreadsheetApp.getActive().getSpreadsheetTimeZone(), "yyyy年M月d日");

    let formDescription = `この度は、「第${seminarId}回 よつばセミナー in 沖縄」にお申込みいただき、誠にありがとうございます。\n\n` +
                          `【テーマ】\n${seminarTheme}\n\n` +
                          `【開催日時】\n${formattedDate} ${seminarTime || ''}\n\n` +
                          `【会場】\n${seminarVenue || 'オンライン参加も可能です'}\n\n`;

    if (konshinkaiTime) {
      formDescription += `--- \n【懇親会のご案内】\n` +
                         `セミナー終了後、懇親会を予定しております。\n` +
                         (konshinkaiVenue ? `会場: ${konshinkaiVenue}\n` : '') +
                         (konshinkaiFee ? `会費: ${konshinkaiFee}\n` : '');
    }

    formDescription += `\n以下のフォームにご入力の上、送信してください。`;

    const form = FormApp.create(formTitle)
                        .setDescription(formDescription)
                        .setCollectEmail(true);

    const onScreenConfirmationMessage = 'お申込みありがとうございます。\nご入力いただいたメールアドレス宛に受付完了メールを自動送信いたしましたので、ご確認ください。';
    let emailBodyForTrigger = `この度は、「${formTitle}」にお申込みいただき、誠にありがとうございます。\n\n事務局にてお申込み内容を確認しております。`;

    if (paymentMethod === '事前振込') {
      const bankInfo = '\n\n' +
        '------------------------------------\n' +
        'お支払いのご案内\n' +
        '------------------------------------\n' +
        'セミナー参加費および懇親会費は、以下の口座へのお振込みをお願いいたします。\n' +
        '（お申し込み後、5営業日以内を目安にお手続きください）\n\n' +
        '【お振込先】\n' +
        '金融機関名： GMOあおぞらネット銀行\n' +
        '支店名： 法人第二営業部 (102)\n' +
        '口座種別： 普通\n' +
        '口座番号： 1399863\n' +
        '口座名義： 一般社団法人よつば親愛信託おきなわ\n' +
        'カナ名義： シヤ）ヨツバシンアイシンタクオキナワ\n\n' +
        '※ 振込手数料はご負担くださいますようお願い申し上げます。\n' +
        '※ 振込名義人の前に、お申し込みセミナーの開催日（例：0704）を入力いただけますと大変助かります。';
      
      emailBodyForTrigger += bankInfo;
    }

    form.setConfirmationMessage(onScreenConfirmationMessage);

    // Store email body for the trigger function to use. Keyed by the unique form ID.
    PropertiesService.getScriptProperties().setProperty(form.getId(), emailBodyForTrigger);

    // Create a trigger that will run a function when the form is submitted.
    ScriptApp.newTrigger('sendConfirmationEmail')
      .forForm(form)
      .onFormSubmit()
      .create();

    // 質問項目
    form.addTextItem().setTitle('参加者氏名').setRequired(true);
    form.addTextItem().setTitle('参加者氏名ふりがな');
    form.addTextItem().setTitle('電話番号').setRequired(true);
    
    // 参加方法の質問（沖縄版では会場は固定のため、会場名を尋ねる質問は不要）
    form.addListItem()
        .setTitle('参加方法をお選びください')
        .setChoiceValues(['会場参加', 'オンライン参加（Zoom）'])
        .setRequired(true);
    
    form.addListItem()
        .setTitle('会員種別をお選びください')
        .setChoiceValues(['正会員', '賛助会員', '一般'])
        .setRequired(true);

    // 懇親会の質問
    if (konshinkaiTime) {
      let konshinkaiQuestionTitle = '懇親会へのご参加';
      if (konshinkaiFee) {
        konshinkaiQuestionTitle += `（会費: ${konshinkaiFee}）`;
      }
      form.addListItem()
          .setTitle(konshinkaiQuestionTitle)
          .setChoiceValues(['参加する', '参加しない'])
          .setRequired(true);
    }
    
    form.addParagraphTextItem().setTitle('ご質問・ご連絡事項');
    
    const formUrl = form.getPublishedUrl();
    formUrlCell.setValue(formUrl);
    
    SpreadsheetApp.getUi().alert(`申込フォームの作成が完了しました。\n\nQ列にフォームのURLを記載しました。\n\nフォームを編集する場合はこちらのURLにアクセスしてください:\n${form.getEditUrl()}`);

  } catch (e) {
    SpreadsheetApp.getUi().alert(`エラーが発生しました: ${e.message}`);
  }
} 

/**
 * This function is triggered on form submission.
 * It sends a confirmation email to the respondent.
 * @param {Object} e The event object from the form submission.
 */
function sendConfirmationEmail(e) {
  try {
    const formResponse = e.response;
    const respondentEmail = formResponse.getRespondentEmail();
    
    // Exit if the respondent's email is not collected
    if (!respondentEmail) {
      Logger.log("Respondent's email address was not found. Cannot send confirmation email.");
      return;
    }

    const form = e.source;
    const formId = form.getId();
    
    const properties = PropertiesService.getScriptProperties();
    let emailBody = properties.getProperty(formId);

    if (!emailBody) {
        Logger.log(`Email body property not found for form ID: ${formId}.`);
        // Fallback message in case the property is missing
        emailBody = `お申込みいただきありがとうございます。`;
    }

    // Append the user's submitted answers to the email body
    let responseDetails = '\n\n▼お申込み内容\n------------------------------------\n';
    const itemResponses = formResponse.getItemResponses();
    for (let i = 0; i < itemResponses.length; i++) {
        const itemResponse = itemResponses[i];
        responseDetails += `${itemResponse.getItem().getTitle()}: ${itemResponse.getResponse()}\n`;
    }
    responseDetails += '------------------------------------\n';

    emailBody += responseDetails;

    const subject = `【よつばセミナー in 沖縄】お申込みありがとうございます`;

    MailApp.sendEmail({
      to: respondentEmail,
      subject: subject,
      body: emailBody,
      name: 'よつばセミナー in 沖縄 事務局'
    });

  } catch (error) {
    // Log errors for debugging
    Logger.log(`Failed to send confirmation email. Error: ${error.toString()}`);
  }
} 