const axios = require('axios');

async function findFreeImageModels() {
  try {
    const res = await axios.get('https://openrouter.ai/api/v1/models');
    const allModels = res.data.data || [];
    
    // Filter models that have "image" in output_modalities or generate images
    const imageModels = allModels.filter(m => 
      m.architecture?.output_modalities?.includes('image') ||
      m.id.includes('flux') ||
      m.id.includes('stable-diffusion') ||
      m.id.includes('imagen')
    );

    console.log(`Found ${imageModels.length} image models in main registry.`);
    
    const freeModels = imageModels.filter(m => {
      const price = parseFloat(m.pricing?.prompt || '0') + parseFloat(m.pricing?.completion || '0');
      return price === 0;
    });

    console.log(`Found ${freeModels.length} free image models.`);
    
    if (freeModels.length > 0) {
      freeModels.forEach(m => {
        console.log(`- ID: ${m.id} | Name: ${m.name}`);
      });
    } else {
      console.log('No free image models are currently available on OpenRouter.');
      
      console.log('\nCheapest image models:');
      const sorted = imageModels.sort((a, b) => {
        const priceA = parseFloat(a.pricing?.image || a.pricing?.prompt || '0');
        const priceB = parseFloat(b.pricing?.image || b.pricing?.prompt || '0');
        return priceA - priceB;
      });
      
      sorted.slice(0, 10).forEach(m => {
        console.log(`- ID: ${m.id} | Name: ${m.name} | Price per image/request: $${m.pricing?.image || m.pricing?.prompt || '0'}`);
      });
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

findFreeImageModels();
