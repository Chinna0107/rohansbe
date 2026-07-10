const axios = require('axios');

async function placeOrder() {
  try {
    const payload = {
      customer: {
        name: "Test Customer",
        email: "chinnakancharla1@gmail.com",
        phone: "9999999999",
        address: "123 Test St"
      },
      items: [
        {
          name: "Test Product 13",
          price: 500,
          quantity: 1,
          size: "L",
          image: "https://via.placeholder.com/150"
        }
      ],
      subtotal: 500,
      finalTotal: 500,
      paymentMethod: "whatsapp",
      paymentStatus: "pending"
    };

    console.log("Sending request to backend (port 3000)...");
    const res = await axios.post('http://localhost:3000/api/orders', payload);
    console.log("Response Status:", res.status);
    console.log("Response Data:", res.data);
  } catch (error) {
    console.log("Request failed!");
    if (error.response) {
      console.log("Data:", error.response.data);
      console.log("Status:", error.response.status);
      console.log("Headers:", error.response.headers);
    } else if (error.request) {
      console.log("No response received. Error:", error.message);
    } else {
      console.log("Error:", error.message);
    }
  }
}

placeOrder();
