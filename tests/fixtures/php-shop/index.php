<?php require __DIR__ . '/cart.php'; ?>
<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn&display=swap" rel="stylesheet">
  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>
  <script src="https://www.paypal.com/sdk/js?client-id=test"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <img src="https://www.gravatar.com/avatar/<?= md5($email) ?>" alt="">
  <iframe src="https://www.youtube.com/embed/abc123"></iframe>
  <iframe src="https://maps.google.com/maps?q=tehran&output=embed"></iframe>
  <form method="post"><div class="g-recaptcha" data-sitekey="x"></div></form>
</body>
</html>
