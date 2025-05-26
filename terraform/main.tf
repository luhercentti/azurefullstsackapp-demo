terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.0"
    }
  }
}

provider "azurerm" {
  features {}
  skip_provider_registration = true
}

# Resource Group
# resource "azurerm_resource_group" "main" {
#   name     = var.resource_group_name
#   location = var.location
# }

#imported RG
resource "azurerm_resource_group" "main" {
    name     = "luis.angelo"
    location = "East US"
}

# Container Registry
resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "logs" {
  name                = "${var.project_name}-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# Container Apps Environment
resource "azurerm_container_app_environment" "main" {
  name                       = "${var.project_name}-env"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id
}

# Container App
# Container App
resource "azurerm_container_app" "api" {
  name                         = "${var.project_name}-api"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  template {
    container {
      name   = "api"
      image  = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"  # Placeholder image
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "PORT"
        value = "8000"
      }
    }

    min_replicas = 1
    max_replicas = 3
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 8000

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "registry-password"
  }

  secret {
    name  = "registry-password"
    value = azurerm_container_registry.acr.admin_password
  }

  # Ignore image changes since the pipeline will update it
  lifecycle {
    ignore_changes = [
      template[0].container[0].image
    ]
  }
}

# Static Web App (updated to use azurerm_static_web_app)
resource "azurerm_static_web_app" "frontend" {
  name                = "${var.project_name}-frontend"
  resource_group_name = azurerm_resource_group.main.name
  location            = "East US2" # Static Web Apps limited regions
  sku_tier            = "Free"
  sku_size            = "Free"

  app_settings = {
    REACT_APP_API_URL = "https://${azurerm_container_app.api.ingress[0].fqdn}"
  }
}
