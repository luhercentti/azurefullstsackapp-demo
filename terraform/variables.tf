variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "rg-lhc-demo"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "East US"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "lhc"
}

variable "acr_name" {
  description = "Name of the Azure Container Registry"
  type        = string
  default     = "acrlhc"
}