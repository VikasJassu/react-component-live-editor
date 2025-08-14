const request = require("supertest");
const app = require("../src/server");

describe("Component API", () => {
  let componentId;

  describe("POST /api/components/save", () => {
    it("should save a valid React component", async () => {
      const componentData = {
        code: "function TestComponent() { return <div>Hello World</div>; }",
        properties: {
          0: {
            style: {
              color: "#ff0000",
              fontSize: "16px",
            },
          },
        },
        title: "Test Component",
        description: "A test component",
      };

      const response = await request(app)
        .post("/api/components/save")
        .send(componentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("url");
      expect(response.body.data).toHaveProperty("shareUrl");

      componentId = response.body.data.id;
    });

    it("should reject invalid JSX code", async () => {
      const componentData = {
        code: 'function TestComponent() { eval("malicious code"); return <div>Test</div>; }',
        title: "Malicious Component",
      };

      const response = await request(app)
        .post("/api/components/save")
        .send(componentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation failed");
    });

    it("should reject empty code", async () => {
      const componentData = {
        code: "",
        title: "Empty Component",
      };

      const response = await request(app)
        .post("/api/components/save")
        .send(componentData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/components/:id", () => {
    it("should load a saved component", async () => {
      const response = await request(app)
        .get(`/api/components/${componentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("id", componentId);
      expect(response.body.data).toHaveProperty("code");
      expect(response.body.data).toHaveProperty("title", "Test Component");
    });

    it("should return 404 for non-existent component", async () => {
      const fakeId = "123e4567-e89b-12d3-a456-426614174000";

      const response = await request(app)
        .get(`/api/components/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Component not found");
    });

    it("should return 400 for invalid UUID format", async () => {
      const response = await request(app)
        .get("/api/components/invalid-id")
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/components/:id", () => {
    it("should update an existing component", async () => {
      const updates = {
        title: "Updated Test Component",
        description: "An updated test component",
      };

      const response = await request(app)
        .put(`/api/components/${componentId}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe("Updated Test Component");
      expect(response.body.data.description).toBe("An updated test component");
    });

    it("should return 404 for non-existent component", async () => {
      const fakeId = "123e4567-e89b-12d3-a456-426614174000";

      const response = await request(app)
        .put(`/api/components/${fakeId}`)
        .send({ title: "Updated" })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/components", () => {
    it("should list components with pagination", async () => {
      const response = await request(app)
        .get("/api/components?page=1&limit=10")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toHaveProperty("page", 1);
      expect(response.body.pagination).toHaveProperty("limit", 10);
      expect(response.body.pagination).toHaveProperty("total");
      expect(response.body.pagination).toHaveProperty("pages");
    });
  });

  describe("DELETE /api/components/:id", () => {
    it("should delete an existing component", async () => {
      const response = await request(app)
        .delete(`/api/components/${componentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Component deleted successfully");
    });

    it("should return 404 for already deleted component", async () => {
      const response = await request(app)
        .delete(`/api/components/${componentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});

describe("Health Check", () => {
  it("should return server health status", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toHaveProperty("status", "OK");
    expect(response.body).toHaveProperty("timestamp");
    expect(response.body).toHaveProperty("uptime");
  });
});
