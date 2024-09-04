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
                "purpose"). Chỉ cần trả ra nó là loại tính từ nào, không cần nói thêm bất cứ gì nữa!`;

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
