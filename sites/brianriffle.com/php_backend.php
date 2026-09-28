<?php
// process-form.php - Contact form handler

// Configuration.
// The destination address lives in contact-config.php, which is gitignored so
// it never lands in a public repo. Copy contact-config.example.php to
// contact-config.php and set your address there.
$config_file = __DIR__ . '/contact-config.php';
if (!file_exists($config_file)) {
    http_response_code(500);
    exit('Contact form is not configured.');
}
$config = require $config_file;
$to_email = $config['to_email'];
$subject = "New Project Inquiry from Website";
$from_name = "Next Step Retail Inquiry";

// Security: Only allow POST requests
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    header("Location: index.html");
    exit();
}

// Get form data and sanitize
$name = isset($_POST['name']) ? trim(strip_tags($_POST['name'])) : '';
$company = isset($_POST['company']) ? trim(strip_tags($_POST['company'])) : '';
$phone = isset($_POST['phone']) ? trim(strip_tags($_POST['phone'])) : '';
$email = isset($_POST['email']) ? trim(strip_tags($_POST['email'])) : '';
$project = isset($_POST['project']) ? trim(strip_tags($_POST['project'])) : '';

// Basic validation
$errors = array();

if (empty($name)) {
    $errors[] = "Name is required";
}

if (empty($phone)) {
    $errors[] = "Phone number is required";
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = "Valid email address is required";
}

if (empty($project)) {
    $errors[] = "Project description is required";
}

// If there are errors, redirect back with error message
if (!empty($errors)) {
    $error_message = implode(", ", $errors);
    header("Location: index.html?error=" . urlencode($error_message));
    exit();
}

// Create email content
$email_body = "New project inquiry received:\n\n";
$email_body .= "Name: " . $name . "\n";
if (!empty($company)) {
    $email_body .= "Company: " . $company . "\n";
}
$email_body .= "Phone: " . $phone . "\n";
$email_body .= "Email: " . $email . "\n";
$email_body .= "Project Description:\n" . $project . "\n\n";
$email_body .= "Submitted on: " . date("Y-m-d H:i:s") . "\n";
$email_body .= "From IP: " . $_SERVER['REMOTE_ADDR'];

// Email headers
$headers = array();
$headers[] = "From: " . $from_name . " <noreply@" . $_SERVER['HTTP_HOST'] . ">";
$headers[] = "Reply-To: " . $name . " <" . $email . ">";
$headers[] = "Content-Type: text/plain; charset=UTF-8";
$headers[] = "X-Mailer: PHP/" . phpversion();

// Send email
$mail_sent = mail($to_email, $subject, $email_body, implode("\r\n", $headers));

// Redirect with success or error message
if ($mail_sent) {
    header("Location: thank_you_page.html");
} else {
    header("Location: index.html?error=" . urlencode("Sorry, there was an error sending your message. Please try again."));
}

exit();
?>