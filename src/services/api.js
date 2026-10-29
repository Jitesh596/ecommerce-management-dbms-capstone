import axios from "axios";

const API_URL = "https://fakestoreapi.com/products";

// Get all products
export const getProducts = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.log("Error fetching products:", error);
        return [];
    }
};

// Get single product by id
export const getSingleProduct = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.log("Error fetching product:", error);
        return null;
    }
};