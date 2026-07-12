resource "aws_cognito_user_pool" "shopper" {
  name                     = "ensemble-grafana-shoppers"
  deletion_protection      = "ACTIVE"
  auto_verified_attributes = ["email"]
}

resource "aws_cognito_identity_provider" "google" {
  user_pool_id  = aws_cognito_user_pool.shopper.id
  provider_name = "Google"
  provider_type = "Google"
  provider_details = {
    attributes_url                = "https://people.googleapis.com/v1/people/me?personFields="
    attributes_url_add_attributes = "true"
    authorize_scopes              = "openid email profile"
    authorize_url                 = "https://accounts.google.com/o/oauth2/v2/auth"
    client_id                     = var.google_client_id
    client_secret                 = var.google_client_secret
    oidc_issuer                   = "https://accounts.google.com"
    token_request_method          = "POST"
    token_url                     = "https://www.googleapis.com/oauth2/v4/token"
  }
  attribute_mapping = {
    email    = "email"
    username = "sub"
    name     = "name"
  }
}

resource "aws_cognito_user_pool_domain" "hosted_ui" {
  domain       = var.cognito_domain_prefix
  user_pool_id = aws_cognito_user_pool.shopper.id
}

resource "aws_cognito_user_pool_client" "web" {
  name                                 = "ensemble-grafana-web"
  user_pool_id                         = aws_cognito_user_pool.shopper.id
  supported_identity_providers         = ["Google"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  callback_urls = compact([
    "https://${var.domain_name}/auth/callback",
    var.secondary_domain_name != "" ? "https://${var.secondary_domain_name}/auth/callback" : "",
    var.tertiary_domain_name != "" ? "https://${var.tertiary_domain_name}/auth/callback" : "",
  ])
  logout_urls = compact([
    "https://${var.domain_name}/",
    var.secondary_domain_name != "" ? "https://${var.secondary_domain_name}/" : "",
    var.tertiary_domain_name != "" ? "https://${var.tertiary_domain_name}/" : "",
  ])
  prevent_user_existence_errors        = "ENABLED"

  depends_on = [aws_cognito_identity_provider.google]
}
