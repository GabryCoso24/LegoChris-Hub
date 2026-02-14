// Email templates for LegoChris - Dark theme matching website design

const baseStyles = `
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1A1612 !important;
      background-color: #FAF8F5 !important;
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    .email-wrapper {
      background: #FAF8F5 !important;
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #FFFFFF !important;
      border: 1px solid #E5DDD3 !important;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    }
    
    /* Header */
    .header {
      background: linear-gradient(135deg, #FF8C42 0%, #FFB84D 50%, #FF8C42 100%) !important;
      padding: 50px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header-title {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      margin: 0;
      font-size: 40px;
      font-weight: 700;
      color: #FFFFFF !important;
      text-shadow: 2px 2px 6px rgba(0,0,0,0.15);
      position: relative;
      z-index: 2;
      letter-spacing: -1px;
    }
    .badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.95) !important;
      color: #1A1612 !important;
      padding: 8px 20px;
      border-radius: 24px;
      font-size: 13px;
      font-weight: 600;
      margin-top: 16px;
      position: relative;
      z-index: 2;
      border: 1px solid rgba(0, 0, 0, 0.1) !important;
      letter-spacing: 0.5px;
    }
    
    /* Content */
    .content {
      padding: 50px 40px;
      position: relative;
      background: #FFFFFF !important;
    }
    .content::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, rgba(255, 140, 66, 0.3) 50%, transparent 100%);
    }
    .greeting {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      font-size: 24px;
      color: #D67A34 !important;
      margin-bottom: 24px;
      font-weight: 600;
    }
    .text {
      color: #5A524A !important;
      margin-bottom: 16px;
      font-size: 16px;
      line-height: 1.7;
    }
    
    /* Divider */
    .divider {
      height: 2px;
      background: linear-gradient(90deg, transparent 0%, #FF8C42 20%, #FFB84D 50%, #FF8C42 80%, transparent 100%) !important;
      margin: 30px 0;
      border-radius: 2px;
      border: none;
    }
    
    /* Button */
    .button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #FF8C42 0%, #FFB84D 100%) !important;
      color: #FFFFFF !important;
      text-decoration: none;
      border-radius: 10px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      font-weight: 700;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(255, 140, 66, 0.3);
      letter-spacing: 0.3px;
      margin: 20px 0;
    }
    
    /* Box */
    .box {
      background: #FFF8F0 !important;
      padding: 20px 24px;
      border-radius: 10px;
      margin: 20px 0;
      border: 1px solid #FFE4CC !important;
      box-shadow: 0 2px 8px rgba(255, 140, 66, 0.08);
    }
    .box p {
      color: #1A1612 !important;
      margin: 0;
      line-height: 1.7;
    }
    .box strong {
      color: #D67A34 !important;
    }
    
    /* Table */
    .order-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .order-table th, 
    .order-table td {
      padding: 14px 12px;
      text-align: left;
      border-bottom: 1px solid #E5DDD3;
    }
    .order-table th {
      background: #FFF8F0 !important;
      font-weight: 600;
      color: #D67A34 !important;
      font-size: 14px;
    }
    .order-table td {
      color: #5A524A !important;
    }
    .total-row {
      font-weight: bold !important;
      font-size: 18px !important;
    }
    .total-row td {
      color: #D67A34 !important;
      padding-top: 16px !important;
    }
    
    /* Footer */
    .footer {
      text-align: center;
      padding: 40px 30px;
      background: #FAF8F5 !important;
      border-top: 1px solid #E5DDD3 !important;
    }
    .footer p {
      margin: 10px 0;
      line-height: 1.6;
      font-size: 13px;
      color: #5A524A !important;
    }
    .footer-links {
      margin: 20px 0;
    }
    .footer-link {
      color: #D67A34 !important;
      text-decoration: none;
      margin: 0 10px;
      font-size: 13px;
      font-weight: 500;
    }
    .footer-link:hover {
      text-decoration: underline;
    }
    .copyright {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #E5DDD3 !important;
      color: #8A8276 !important;
      font-size: 12px;
    }
    
    /* Mobile */
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px !important;
      }
      .content {
        padding: 40px 24px !important;
      }
      .header {
        padding: 40px 20px !important;
      }
      .header-title {
        font-size: 32px !important;
      }
      .greeting {
        font-size: 20px !important;
      }
      .text {
        font-size: 15px !important;
      }
      .box {
        padding: 16px 20px !important;
      }
    }
  </style>
`;

export const welcomeEmail = (name) => `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Benvenuto su LegoChris!</title>
  ${baseStyles}
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <h1 class="header-title" style="color: #FFFFFF !important;">LegoChris</h1>
        <div class="badge">🎮 BENVENUTO</div>
      </div>
      
      <div class="content">
        <div class="greeting">Ciao ${name || 'Amico'}! 👋</div>
      
      <p class="text" style="color: #1A1612 !important;">
        Benvenuto nella community di LegoChris! Siamo entusiasti di averti con noi.
      </p>
      
      <p class="text" style="color: #1A1612 !important;">
        Ora fai parte di una community appassionata di Super Mario, Nintendo e gaming. 
        Ecco cosa puoi fare:
      </p>
      
      <div class="box">
        <p style="margin: 0; color: #1A1612 !important;"><strong style="color: #D67A34 !important;">✨ Contenuti Esclusivi</strong><br>Accedi a video, guide e contenuti riservati ai membri</p>
      </div>
      
      <div class="box">
        <p style="margin: 0; color: #1A1612 !important;"><strong style="color: #D67A34 !important;">💬 Community Discord</strong><br>Unisciti alla nostra community su Discord per chattare e giocare insieme</p>
      </div>
      
      <div class="box">
        <p style="margin: 0; color: #1A1612 !important;"><strong style="color: #D67A34 !important;">🛒 Shop Esclusivo</strong><br>Sconti speciali e accesso anticipato ai nuovi prodotti</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button" style="color: #FFFFFF !important;">
          Esplora LegoChris 🚀
        </a>
      </div>
      
      <hr class="divider">
      
      <p class="text" style="color: #1A1612 !important;">
        <strong style="color: #1A1612 !important;">Prossimi passi:</strong>
      </p>
      <p class="text" style="color: #1A1612 !important;">
        1. Completa il tuo profilo<br>
        2. Collega il tuo account Discord<br>
        3. Esplora i video e lo shop
      </p>
      
      <p class="text" style="color: #1A1612 !important;" style="color: #1A1612 !important;">
        Se hai domande o hai bisogno di aiuto, non esitare a contattarci!
      </p>
      
      <p class="text" style="margin-top: 30px; color: #1A1612 !important;">
        A presto,<br>
        <strong style="color: #D67A34 !important;">Il Team LegoChris</strong> 🎮
      </p>
      </div>
      
      <div class="footer">
        <p style="color: #5A524A !important;"><strong style="color: #1A1612 !important;">LegoChris</strong> - La tua community per Super Mario e Nintendo</p>
        <div class="footer-links">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/privacy" class="footer-link">Privacy Policy</a>
          <span style="color: #5A524A !important;">•</span>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/terms" class="footer-link">Termini di Servizio</a>
        </div>
        <div class="copyright">
          © ${new Date().getFullYear()} LegoChris. Tutti i diritti riservati.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const passwordResetEmail = (name, resetLink) => `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - LegoChris</title>
  ${baseStyles}
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <h1 class="header-title" style="color: #FFFFFF !important;">LegoChris</h1>
        <div class="badge">🔒 RESET PASSWORD</div>
      </div>
      
      <div class="content">
        <div class="greeting">Ciao ${name || 'Amico'}! 👋</div>
      
      <p class="text" style="color: #1A1612 !important;">
        Hai richiesto di reimpostare la password del tuo account LegoChris.
      </p>
      
      <p class="text" style="color: #1A1612 !important;">
        Clicca sul pulsante qui sotto per creare una nuova password:
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" class="button" style="color: #FFFFFF !important;">
          Reimposta Password 🔑
        </a>
      </div>
      
      <div class="box">
        <p style="margin: 0; color: #1A1612 !important;">
          <strong style="color: #1A1612 !important;">⚠️ Importante:</strong><br>
          Questo link è valido per 1 ora. Se non hai richiesto tu questa reimpostazione, 
          ignora questa email e la tua password rimarrà invariata.
        </p>
      </div>
      
      <hr class="divider">
      
      <p class="text" style="font-size: 14px; color: #1A1612 !important;">
        Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br>
        <a href="${resetLink}" style="color: #D67A34 !important; word-break: break-all;">${resetLink}</a>
      </p>
      
      <p class="text" style="margin-top: 30px; color: #1A1612 !important;">
        <strong style="color: #D67A34 !important;">Il Team LegoChris</strong> 🎮
      </p>
      </div>
      
      <div class="footer">
        <p style="color: #5A524A !important;"><strong style="color: #1A1612 !important;">LegoChris</strong> - La tua community per Super Mario e Nintendo</p>
        <div class="footer-links">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/privacy" class="footer-link">Privacy Policy</a>
          <span style="color: #5A524A !important;">•</span>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/terms" class="footer-link">Termini di Servizio</a>
        </div>
        <div class="copyright">
          © ${new Date().getFullYear()} LegoChris. Tutti i diritti riservati.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const orderReceiptEmail = (name, order) => {
  const items = order.items || [];
  const subtotal = items.reduce((sum, item) => {
    const product = item.product || {};
    return sum + ((product.price || 0) * (item.quantity || 0));
  }, 0);
  const shipping = order.shipping || 0;
  const total = order.amount || (subtotal + shipping);

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ricevuta Ordine - LegoChris</title>
  ${baseStyles}
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <h1 class="header-title" style="color: #FFFFFF !important;">LegoChris</h1>
        <div class="badge">🛒 SHOP</div>
      </div>
      
      <div class="content">
        <div class="greeting">Grazie ${name || 'per il tuo ordine'}! 🎉</div>
      
      <p class="text" style="color: #1A1612 !important;">
        Il tuo ordine è stato confermato e sarà spedito al più presto!
      </p>
      
      <div class="box">
        <p style="margin: 0; color: #1A1612 !important;">
          <strong style="color: #1A1612 !important;">Ordine #${order.id}</strong><br>
          Data: ${new Date(order.created_at).toLocaleDateString('it-IT', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
      
      <h3 style="margin-top: 30px; margin-bottom: 15px; color: #D67A34 !important; font-size: 18px;">Dettagli Ordine:</h3>
      
      <table class="order-table">
        <thead>
          <tr>
            <th>Prodotto</th>
            <th>Quantità</th>
            <th>Prezzo</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => {
            const product = item.product || {};
            return `
              <tr>
                <td>${product.title || 'Prodotto'}</td>
                <td>${item.quantity || 1}</td>
                <td>€${((product.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
              </tr>
            `;
          }).join('')}
          ${shipping > 0 ? `
          <tr>
            <td colspan="2" style="color: #1A1612 !important;">Spedizione</td>
            <td style="color: #1A1612 !important;">€${shipping.toFixed(2)}</td>
          </tr>
          ` : `
          <tr>
            <td colspan="2" style="color: #1A1612 !important;">Spedizione</td>
            <td style="color: #D67A34 !important;"><strong style="color: #D67A34 !important;">Gratuita</strong></td>
          </tr>
          `}
          <tr class="total-row">
            <td colspan="2"><strong style="color: #1A1612 !important;">Totale</strong></td>
            <td><strong style="color: #1A1612 !important;">€${total.toFixed(2)}</strong></td>
          </tr>
        </tbody>
      </table>
      
      ${order.shipping_address ? `
      <h3 style="margin-top: 30px; margin-bottom: 15px; color: #D67A34 !important; font-size: 18px;">📦 Indirizzo di Spedizione:</h3>
      <div class="box">
        <p style="margin: 0; line-height: 1.6; color: #1A1612 !important;">
          ${order.shipping_name || order.customer_name || ''}<br>
          ${order.shipping_address.line1 || ''}<br>
          ${order.shipping_address.line2 ? `${order.shipping_address.line2}<br>` : ''}
          ${order.shipping_address.postal_code || ''} ${order.shipping_address.city || ''}<br>
          ${order.shipping_address.state ? `${order.shipping_address.state}<br>` : ''}
          ${order.shipping_address.country || ''}
        </p>
      </div>
      ` : ''}
      
      ${order.customer_email ? `
      <div class="box">
        <p style="margin: 0; color: #1A1612 !important;">
          <strong style="color: #1A1612 !important;">📧 Email:</strong> ${order.customer_email}<br>
          ${order.customer_name ? `<strong style="color: #1A1612 !important;">👤 Nome:</strong> ${order.customer_name}<br>` : ''}
          ${order.customer_phone ? `<strong style="color: #1A1612 !important;">📱 Telefono:</strong> ${order.customer_phone}` : ''}
        </p>
      </div>
      ` : ''}
      
      <hr class="divider">
      
      <p class="text" style="color: #1A1612 !important;">
        <strong style="color: #1A1612 !important;">Cosa succede ora?</strong>
      </p>
      <p class="text" style="color: #1A1612 !important;">
        1. Il tuo ordine è in preparazione<br>
        2. Riceverai un'email con il tracking della spedizione<br>
        3. Il pacco arriverà entro 3-5 giorni lavorativi
      </p>
      
      <p class="text" style="color: #1A1612 !important;" style="color: #1A1612 !important;">
        Per qualsiasi domanda, non esitare a contattarci!
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/shop" class="button" style="color: #FFFFFF !important;">
          Continua lo Shopping 🛒
        </a>
      </div>
      
      <p class="text" style="margin-top: 30px; color: #1A1612 !important;">
        A presto,<br>
        <strong style="color: #D67A34 !important;">Il Team LegoChris</strong> 🎮
      </p>
      </div>
      
      <div class="footer">
        <p style="color: #5A524A !important;"><strong style="color: #1A1612 !important;">LegoChris</strong> - La tua community per Super Mario e Nintendo</p>
        <div class="footer-links">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/privacy" class="footer-link">Privacy Policy</a>
          <span style="color: #5A524A !important;">•</span>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/terms" class="footer-link">Termini di Servizio</a>
        </div>
        <div class="copyright">
          © ${new Date().getFullYear()} LegoChris. Tutti i diritti riservati.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;
};

// Newsletter email template
export const newsletterEmail = (name, message) => {
  return `
<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Newsletter LegoChris</title>
    <!--[if mso]>
    <style type="text/css">
      body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #1A1612 !important;
        background-color: #FAF8F5 !important;
        margin: 0;
        padding: 0;
        width: 100% !important;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      .email-wrapper {
        background: #FAF8F5 !important;
        padding: 40px 20px;
      }
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background: #FFFFFF !important;
        border: 1px solid #E5DDD3 !important;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      }
      .content {
        padding: 50px 40px;
        position: relative;
        background: #FFFFFF !important;
      }
      .message {
        background: #FFF8F0 !important;
        padding: 30px;
        border-radius: 12px;
        margin: 30px 0;
        white-space: pre-wrap;
        line-height: 1.8;
        font-size: 16px;
        color: #1A1612 !important;
        border: 1px solid #FFE4CC !important;
        box-shadow: 0 2px 8px rgba(255, 140, 66, 0.08);
      }
      .greeting {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        font-size: 22px;
        color: #D67A34 !important;
        margin-bottom: 24px;
        font-weight: 600;
      }
      .feature-text {
        font-size: 13px;
        color: #5A524A !important;
        font-weight: 500;
      }
      .feature {
        display: table-cell;
        text-align: center;
        padding: 20px 12px;
        background: #FFF8F0 !important;
        border-radius: 10px;
        border: 1px solid #FFE4CC !important;
      }
      .social-section {
        background: #F9F7F4 !important;
        padding: 50px 30px 45px;
        text-align: center;
        border-top: 1px solid #E5DDD3 !important;
        margin-top: 10px;
      }
      .social-title {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        font-size: 18px;
        color: #1A1612 !important;
        margin-bottom: 25px;
        font-weight: 600;
      }
      .social-link {
        display: inline-block !important;
        text-align: center;
        padding: 14px 24px;
        background: #FFF8F0 !important;
        color: #D67A34 !important;
        text-decoration: none;
        font-size: 14px;
        font-weight: 600;
        border: 1px solid #FFE4CC !important;
        border-radius: 8px;
        margin: 0 6px 8px 6px;
      }
      .footer {
        text-align: center;
        padding: 40px 30px;
        background: #FAF8F5 !important;
        border-top: 1px solid #E5DDD3 !important;
      }
      .footer p {
        margin: 10px 0;
        line-height: 1.6;
        font-size: 13px;
        color: #5A524A !important;
      }
      .footer-link {
        color: #D67A34 !important;
        text-decoration: none;
        margin: 0 8px;
        font-size: 13px;
        font-weight: 500;
      }
      .copyright {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid #E5DDD3 !important;
        color: #8A8276 !important;
        font-size: 12px;
      }
      
      .header {
        background: linear-gradient(135deg, #FF8C42 0%, #FFB84D 50%, #FF8C42 100%) !important;
        padding: 50px 30px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      .header h1 {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        margin: 0;
        font-size: 40px;
        font-weight: 700;
        color: #FFFFFF !important;
        text-shadow: 2px 2px 6px rgba(0,0,0,0.15);
        position: relative;
        z-index: 2;
        letter-spacing: -1px;
      }
      .badge {
        display: inline-block;
        background: rgba(255, 255, 255, 0.95) !important;
        color: #1A1612 !important;
        padding: 8px 20px;
        border-radius: 24px;
        font-size: 13px;
        font-weight: 600;
        margin-top: 16px;
        position: relative;
        z-index: 2;
        border: 1px solid rgba(0, 0, 0, 0.1) !important;
        letter-spacing: 0.5px;
      }
      .content::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent 0%, rgba(255, 140, 66, 0.3) 50%, transparent 100%);
      }
      .divider {
        height: 2px;
        background: linear-gradient(90deg, transparent 0%, #FF8C42 20%, #FFB84D 50%, #FF8C42 80%, transparent 100%) !important;
        margin: 30px 0;
        border-radius: 2px;
      }
      .cta-section {
        text-align: center;
        margin: 40px 0;
      }
      .cta-button {
        display: inline-block;
        padding: 16px 40px;
        background: linear-gradient(135deg, #FF8C42 0%, #FFB84D 100%) !important;
        color: #FFFFFF !important;
        text-decoration: none;
        border-radius: 10px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        font-weight: 700;
        font-size: 16px;
        box-shadow: 0 4px 12px rgba(255, 140, 66, 0.3);
        letter-spacing: 0.3px;
      }
      .features {
        display: table;
        width: 100%;
        margin: 35px 0;
        border-spacing: 12px;
      }
      .feature-icon {
        font-size: 28px;
        margin-bottom: 8px;
        display: block;
      }
      .social-links {
        text-align: center;
        line-height: 1.8;
      }
      .footer-links {
        margin: 20px 0;
      }
      .footer-link:hover {
        text-decoration: underline;
      }
      
      @media only screen and (max-width: 600px) {
        .email-wrapper {
          padding: 20px 10px !important;
        }
        .content {
          padding: 40px 24px !important;
        }
        .header {
          padding: 40px 20px !important;
        }
        .header h1 {
          font-size: 32px !important;
        }
        .message {
          padding: 24px !important;
          font-size: 15px !important;
        }
        .feature {
          display: block !important;
          margin-bottom: 12px !important;
        }
        .social-links {
          flex-direction: column !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <h1 style="color: #FFFFFF !important;">LegoChris</h1>
          <div class="badge">🔥 NEWSLETTER UFFICIALE</div>
        </div>
        
        <!-- Content -->
        <div class="content">
          <div class="greeting">Ciao ${name || 'Player'}! 👋</div>
          
          <div class="divider"></div>
          
          <div class="message">${message.replace(/\n/g, '<br>')}</div>
          
          <div class="cta-section">
            <a href="https://legochris.ideovision.com/videos" class="cta-button" style="color: #FFFFFF !important;">
              🎬 GUARDA I VIDEO
            </a>
          </div>
          
          <div class="features">
            <div class="feature">
              <span class="feature-icon">🎮</span>
              <span class="feature-text">Let's Play</span>
            </div>
            <div class="feature">
              <span class="feature-icon">🌟</span>
              <span class="feature-text">Mod Esclusive</span>
            </div>
            <div class="feature">
              <span class="feature-icon">🏆</span>
              <span class="feature-text">Guide Pro</span>
            </div>
          </div>
        </div>
        
        <!-- Social Section -->
        <div class="social-section">
          <div class="social-title">Seguici ovunque! 🌟</div>
          <div class="social-links">
            <a href="https://legochris.ideovision.com" class="social-link">
              🌐 Sito Web
            </a>
            <a href="https://legochris.ideovision.com/discord" class="social-link">
              💬 Discord
            </a>
            <a href="https://legochris.ideovision.com/shop" class="social-link">
              🛒 Shop
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p style="color: #5A524A !important;"><strong style="color: #1A1612 !important;">LegoChris</strong> - Scopri il mondo di Super Mario e Nintendo come mai prima d'ora!</p>
          <p style="color: #5A524A !important;">Hai ricevuto questa email perché sei iscritto alla newsletter.</p>
          <div class="footer-links">
            <a href="https://legochris.ideovision.com/privacy" class="footer-link">Privacy Policy</a>
            <span style="color: #5A524A !important;">•</span>
            <a href="https://legochris.ideovision.com/contact" class="footer-link">Contattaci</a>
          </div>
          <div class="copyright">
            © ${new Date().getFullYear()} LegoChris. Tutti i diritti riservati.
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
`;
};

// Order status update notification email
export const orderStatusUpdateEmail = (order) => {
  const statusConfig = {
    new: {
      emoji: '🆕',
      title: 'Ordine Ricevuto',
      color: '#4A90E2',
      message: 'Il tuo ordine è stato registrato con successo nel nostro sistema.',
      nextSteps: 'Stiamo iniziando a preparare il tuo ordine. Riceverai una conferma quando passerà in elaborazione.'
    },
    processing: {
      emoji: '📦',
      title: 'Ordine in Elaborazione',
      color: '#F5A623',
      message: 'Il tuo ordine è attualmente in fase di preparazione!',
      nextSteps: 'Il nostro team sta preparando i tuoi articoli con cura. Riceverai una notifica quando il pacco sarà spedito.'
    },
    shipped: {
      emoji: '🚚',
      title: 'Ordine Spedito',
      color: '#BD10E0',
      message: 'Ottima notizia! Il tuo ordine è stato spedito e sta arrivando da te!',
      nextSteps: 'Segui il tracking del tuo pacco con il numero fornito qui sotto. Riceverai una conferma alla consegna.'
    },
    delivered: {
      emoji: '✅',
      title: 'Ordine Consegnato',
      color: '#7ED321',
      message: 'Il tuo ordine è stato consegnato con successo!',
      nextSteps: 'Speriamo che tu sia soddisfatto del tuo acquisto! Se hai domande o problemi, non esitare a contattarci.'
    },
    cancelled: {
      emoji: '❌',
      title: 'Ordine Annullato',
      color: '#D0021B',
      message: 'Il tuo ordine è stato annullato.',
      nextSteps: 'Se non hai richiesto tu questa cancellazione o hai domande, contattaci immediatamente.'
    }
  };

  const currentStatus = order.order_status || 'new';
  const config = statusConfig[currentStatus] || statusConfig.new;
  const items = order.items || [];

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aggiornamento Ordine - LegoChris</title>
  ${baseStyles}
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <h1 class="header-title" style="color: #FFFFFF !important;">LegoChris</h1>
        <div class="badge">${config.emoji} ${config.title}</div>
      </div>
      
      <div class="content">
        <div class="greeting">Ciao ${order.customer_name || 'Cliente'}! 👋</div>
      
        <p class="text" style="color: #1A1612 !important;">
          <strong style="color: #1A1612 !important;">${config.message}</strong>
        </p>
        
        <div class="box" style="background: linear-gradient(145deg, ${config.color}15, ${config.color}08) !important; border: 1px solid ${config.color}30 !important;">
          <p style="margin: 0; color: #1A1612 !important;">
            <strong style="color: ${config.color} !important;">Ordine #${order.id}</strong><br>
            Stato: <strong style="color: ${config.color} !important;">${config.emoji} ${config.title}</strong><br>
            Data ordine: ${new Date(order.created_at).toLocaleDateString('it-IT', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
            ${order.updated_at ? `<br>Ultimo aggiornamento: ${new Date(order.updated_at).toLocaleDateString('it-IT', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}` : ''}
          </p>
        </div>

        ${order.tracking_number ? `
        <div class="box" style="background: linear-gradient(145deg, rgba(189, 16, 224, 0.1), rgba(189, 16, 224, 0.05)) !important; border: 1px solid rgba(189, 16, 224, 0.3) !important;">
          <p style="margin: 0; color: #1A1612 !important;">
            <strong style="color: #BD10E0 !important;">🔗 Numero di Tracciamento:</strong><br>
            <span style="font-size: 18px; color: #D67A34 !important; font-family: monospace; letter-spacing: 1px;">${order.tracking_number}</span><br>
            <span style="font-size: 13px; color: #C0B8AD !important;">Usa questo numero per seguire la spedizione del tuo pacco</span>
          </p>
        </div>
        ` : ''}
        
        <h3 style="margin-top: 30px; margin-bottom: 15px; color: #D67A34 !important; font-size: 18px;">📋 Riepilogo Ordine:</h3>
        
        <table class="order-table">
          <thead>
            <tr>
              <th>Prodotto</th>
              <th>Quantità</th>
              <th>Prezzo</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => {
              const product = item.product || {};
              return `
                <tr>
                  <td>
                    ${product.title || 'Prodotto'}
                    ${item.size || item.color ? `<br><span style="font-size: 12px; color: #8A8278 !important;">
                      ${item.size ? `Taglia: ${item.size}` : ''}
                      ${item.size && item.color ? ' • ' : ''}
                      ${item.color ? `Colore: ${item.color}` : ''}
                    </span>` : ''}
                  </td>
                  <td>${item.quantity || 1}</td>
                  <td>€${((product.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
            <tr class="total-row">
              <td colspan="2"><strong style="color: #1A1612 !important;">Totale</strong></td>
              <td><strong style="color: #1A1612 !important;">€${order.amount.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>

        ${order.shipping_address ? `
        <h3 style="margin-top: 30px; margin-bottom: 15px; color: #D67A34 !important; font-size: 18px;">📦 Indirizzo di Spedizione:</h3>
        <div class="box">
          <p style="margin: 0; line-height: 1.6; color: #1A1612 !important;">
            ${order.shipping_name || order.customer_name || ''}<br>
            ${order.shipping_address.line1 || ''}<br>
            ${order.shipping_address.line2 ? `${order.shipping_address.line2}<br>` : ''}
            ${order.shipping_address.postal_code || ''} ${order.shipping_address.city || ''}<br>
            ${order.shipping_address.state ? `${order.shipping_address.state}<br>` : ''}
            ${order.shipping_address.country || ''}
          </p>
        </div>
        ` : ''}
        
        <hr class="divider">
        
        <p class="text" style="color: #1A1612 !important;">
          <strong style="color: #1A1612 !important;">Cosa succede ora?</strong>
        </p>
        <p class="text" style="color: #1A1612 !important;">
          ${config.nextSteps}
        </p>
        
        <p class="text" style="color: #1A1612 !important;">
          Per qualsiasi domanda sul tuo ordine, non esitare a contattarci. Siamo qui per aiutarti!
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders" class="button" style="color: #FFFFFF !important;">
            Visualizza Cronologia Ordini 📋
          </a>
        </div>
        
        <p class="text" style="margin-top: 30px; color: #1A1612 !important;">
          Grazie per aver scelto LegoChris!<br>
          <strong style="color: #D67A34 !important;">Il Team LegoChris</strong> 🎮
        </p>
      </div>
      
      <div class="footer">
        <p style="color: #5A524A !important;"><strong style="color: #1A1612 !important;">LegoChris</strong> - La tua community per Super Mario e Nintendo</p>
        <div class="footer-links">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/privacy" class="footer-link">Privacy Policy</a>
          <span style="color: #5A524A !important;">•</span>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/terms" class="footer-link">Termini di Servizio</a>
          <span style="color: #5A524A !important;">•</span>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/contact" class="footer-link">Contattaci</a>
        </div>
        <div class="copyright">
          © ${new Date().getFullYear()} LegoChris. Tutti i diritti riservati.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;
};

// Admin notification for new order
export const adminNewOrderEmail = (order) => {
  const items = order.items || [];
  const subtotal = items.reduce((sum, item) => {
    const product = item.product || {};
    return sum + ((product.price || 0) * (item.quantity || 0));
  }, 0);
  const shipping = order.shipping || 0;
  const total = order.amount || (subtotal + shipping);

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuovo Ordine Ricevuto - LegoChris Admin</title>
  ${baseStyles}
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <h1 class="header-title" style="color: #FFFFFF !important;">LegoChris</h1>
        <div class="badge">🔔 NUOVO ORDINE</div>
      </div>
      
      <div class="content">
        <div class="greeting">Nuovo ordine ricevuto! 🎉</div>
      
        <p class="text" style="color: #1A1612 !important;">
          <strong style="color: #1A1612 !important;">È stato effettuato un nuovo acquisto nello shop.</strong>
        </p>
        
        <div class="box" style="background: linear-gradient(145deg, rgba(126, 211, 33, 0.15), rgba(126, 211, 33, 0.08)) !important; border: 1px solid rgba(126, 211, 33, 0.3) !important;">
          <p style="margin: 0; color: #1A1612 !important;">
            <strong style="color: #7ED321 !important;">Ordine #${order.id}</strong><br>
            Data: ${new Date(order.created_at).toLocaleDateString('it-IT', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}<br>
            Totale: <strong style="color: #D67A34 !important; font-size: 20px;">€${total.toFixed(2)}</strong>
          </p>
        </div>

        <h3 style="margin-top: 30px; margin-bottom: 15px; color: #D67A34 !important; font-size: 18px;">👤 Informazioni Cliente:</h3>
        <div class="box">
          <p style="margin: 0; color: #1A1612 !important;">
            <strong style="color: #1A1612 !important;">Nome:</strong> ${order.customer_name || 'N/A'}<br>
            <strong style="color: #1A1612 !important;">📧 Email:</strong> ${order.customer_email || 'N/A'}<br>
            ${order.customer_phone ? `<strong style="color: #1A1612 !important;">📱 Telefono:</strong> ${order.customer_phone}<br>` : ''}
          </p>
        </div>

        ${order.shipping_address ? `
        <h3 style="margin-top: 30px; margin-bottom: 15px; color: #D67A34 !important; font-size: 18px;">📦 Indirizzo di Spedizione:</h3>
        <div class="box">
          <p style="margin: 0; line-height: 1.6; color: #1A1612 !important;">
            ${order.shipping_name || order.customer_name || ''}<br>
            ${order.shipping_address.line1 || ''}<br>
            ${order.shipping_address.line2 ? `${order.shipping_address.line2}<br>` : ''}
            ${order.shipping_address.postal_code || ''} ${order.shipping_address.city || ''}<br>
            ${order.shipping_address.state ? `${order.shipping_address.state}<br>` : ''}
            ${order.shipping_address.country || ''}
          </p>
        </div>
        ` : ''}
        
        <h3 style="margin-top: 30px; margin-bottom: 15px; color: #D67A34 !important; font-size: 18px;">📋 Articoli Ordinati:</h3>
        
        <table class="order-table">
          <thead>
            <tr>
              <th>Prodotto</th>
              <th>Quantità</th>
              <th>Prezzo</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => {
              const product = item.product || {};
              return `
                <tr>
                  <td>
                    ${product.title || 'Prodotto'}
                    ${item.size || item.color ? `<br><span style="font-size: 12px; color: #8A8278 !important;">
                      ${item.size ? `Taglia: ${item.size}` : ''}
                      ${item.size && item.color ? ' • ' : ''}
                      ${item.color ? `Colore: ${item.color}` : ''}
                    </span>` : ''}
                  </td>
                  <td>${item.quantity || 1}</td>
                  <td>€${((product.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
            ${shipping > 0 ? `
            <tr>
              <td colspan="2" style="color: #1A1612 !important;">Spedizione</td>
              <td style="color: #1A1612 !important;">€${shipping.toFixed(2)}</td>
            </tr>
            ` : `
            <tr>
              <td colspan="2" style="color: #1A1612 !important;">Spedizione</td>
              <td style="color: #FF8C42 !important;"><strong style="color: #FF8C42 !important;">Gratuita</strong></td>
            </tr>
            `}
            <tr class="total-row">
              <td colspan="2"><strong style="color: #1A1612 !important;">Totale</strong></td>
              <td><strong style="color: #1A1612 !important;">€${total.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <hr class="divider">
        
        <p class="text" style="color: #1A1612 !important;">
          <strong style="color: #1A1612 !important;">Prossimi passi:</strong>
        </p>
        <p class="text" style="color: #1A1612 !important;">
          1. Verifica l'ordine nel pannello admin<br>
          2. Prepara gli articoli per la spedizione<br>
          3. Aggiorna lo stato dell'ordine e invia il tracking al cliente
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin" class="button" style="color: #FFFFFF !important;">
            Gestisci Ordine nel Pannello Admin 🔧
          </a>
        </div>
        
        <div class="box" style="background: rgba(255, 140, 66, 0.08) !important; border: 1px solid rgba(255, 140, 66, 0.2) !important;">
          <p style="margin: 0; font-size: 13px; color: #1A1612 !important;">
            <strong style="color: #1A1612 !important;">ℹ️ Info Pagamento:</strong><br>
            Stripe Session ID: <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-size: 11px; color: #FFFFFF !important;">${order.stripe_session_id || 'N/A'}</code><br>
            ${order.stripe_payment_intent ? `Payment Intent: <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-size: 11px; color: #FFFFFF !important;">${order.stripe_payment_intent}</code>` : ''}
          </p>
        </div>
      </div>
      
      <div class="footer">
        <p style="color: #5A524A !important;"><strong style="color: #1A1612 !important;">LegoChris Admin</strong> - Sistema di gestione ordini</p>
        <div class="copyright">
          © ${new Date().getFullYear()} LegoChris. Tutti i diritti riservati.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;
};


