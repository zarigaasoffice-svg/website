  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkAdminAccess()) return;

    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const file = files[0];
      
      // Validate file type and size
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 5MB limit.');
      }

      if (!currentUser) {
        throw new Error('You must be logged in to upload files.');
      }

      // Upload to Cloudinary
      const uploadResult = await uploadImage(file, 'sarees');
      console.log('Cloudinary upload successful:', uploadResult);

      // Get optimized URL for the image
      const optimizedUrl = getOptimizedImageUrl(uploadResult.url, {
        width: 800,     // Set appropriate width for your use case
        quality: 80,    // Good balance of quality and size
        format: 'auto'  // Let Cloudinary choose best format
      });

      // Update state with the optimized image URL
      if (editingSaree) {
        setEditingSaree({ ...editingSaree, image_url: optimizedUrl });
      } else {
        setNewSaree({ ...newSaree, image_url: optimizedUrl });
      }
      
      console.log('Image URL updated in state:', optimizedUrl);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };