export const userFunctions = () => ({
  getUser: async ({ phoneNumber }: { phoneNumber: string | null }) => {
    return {
      success: true,
      message: "User found",
      user: {
        stores: [{ storeId: "store_123" }]
      }
    };
  }
});

export const productFunctions = () => ({
  createProduct: async (data: any) => {
    console.log("Creating product:", data);
    return { id: "prod_123" };
  }
});
