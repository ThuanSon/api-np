const askCohere = async (wordString) => {
  // Define the API endpoint and API key
  const url = "https://api.cohere.com/v1/chat";
  const apiKey = "L43m79WwnztkJKWZnv2QGYAQkTX4Zou5lWKXInm4";

  const question = `Từ ${wordString} thuộc loại nào trong 8 loại tính từ này ("opinion",
                "size",
                "age",
                "shape",
                "color",
                "origin",
                "material",
                "purpose"). Chỉ cần trả ra đó là loại tính từ nào, từ bạn trả ra phải trùng khớp với 1 trong 8 loại tính từ tôi đưa ra
                và không cần thêm thông tin nào nữa. (Không được chứ những ký tự " và toàn bộ là chữ thường). Nên nhớ KHÔNG CẦN THÊM BẤT
                CỨ THÔNG TIN NÀO NGOÀI 1 TRONG 8 LOẠI TÍNH TỪ Ở TRÊN`;

  // Define the request payload
  const payload = {
    message: question,
    connectors: [
      {
        id: "web-search",
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data?.text; // Return the result from the API
  } catch (error) {
    console.error("Error:", error);
    return "không xác định"; // Return a default value in case of an error
  }
};

module.exports = askCohere;
