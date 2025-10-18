from django.conf import settings

def payments(request):
    """
    Expose PayPal donation settings to all templates.
    """
    return {
        "PAYPAL_DONATE_URL": getattr(settings, "PAYPAL_DONATE_URL", "https://www.paypal.com/donate"),
        "PAYPAL_BUSINESS": getattr(settings, "PAYPAL_BUSINESS", ""),            # Your PayPal email
        "PAYPAL_HOSTED_BUTTON_ID": getattr(settings, "PAYPAL_HOSTED_BUTTON_ID", ""),  # Optional hosted button id
        "PAYPAL_ITEM_NAME": getattr(settings, "PAYPAL_ITEM_NAME", "Support Our Project"),
        "PAYPAL_CURRENCY": getattr(settings, "PAYPAL_CURRENCY", "USD"),
        "PAYPAL_ONE_TIME_ONLY": getattr(settings, "PAYPAL_ONE_TIME_ONLY", True),
        "PAYPAL_DEFAULT_AMOUNT": getattr(settings, "PAYPAL_DEFAULT_AMOUNT", ""),  # e.g. "25.00" or "" for none
    }
