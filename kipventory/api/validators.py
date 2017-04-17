# Note: this will only be called if you call model.full_clean()
# I'm just gonna call this from the serializer to be consistent with our other code
# Eventually we should probably move everything to validators and use full_clean in addition to serializer.is_valid
def validate_file_extension(value):
    import os
    from rest_framework.exceptions import ValidationError
    ext = os.path.splitext(value.name)[1]  # [0] returns path+filename
    valid_extensions = ['.pdf', '.jpg', '.png']
    if not ext.lower() in valid_extensions:
        raise ValidationError({"receipt": ['Unsupported file extension. Use .pdf, .jpg, or .png.']})
