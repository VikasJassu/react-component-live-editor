const fs = require("fs").promises;
const path = require("path");

class ComponentService {
  constructor() {
    this.dataDir = path.join(__dirname, "../../data");
    this.componentsFile = path.join(this.dataDir, "components.json");
    this.initializeStorage();
  }

  async initializeStorage() {
    try {
      await fs.access(this.dataDir);
    } catch (error) {
      await fs.mkdir(this.dataDir, { recursive: true });
    }

    try {
      await fs.access(this.componentsFile);
    } catch (error) {
      await fs.writeFile(this.componentsFile, JSON.stringify([], null, 2));
    }
  }

  async loadComponents() {
    try {
      const data = await fs.readFile(this.componentsFile, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error loading components:", error);
      return [];
    }
  }

  async saveComponents(components) {
    try {
      await fs.writeFile(
        this.componentsFile,
        JSON.stringify(components, null, 2)
      );
    } catch (error) {
      console.error("Error saving components:", error);
      throw new Error("Failed to save component data");
    }
  }

  async save(componentData) {
    const components = await this.loadComponents();

    // Check if component with same ID already exists
    const existingIndex = components.findIndex(
      (c) => c.id === componentData.id
    );
    if (existingIndex !== -1) {
      throw new Error("Component with this ID already exists");
    }

    components.push(componentData);
    await this.saveComponents(components);

    return componentData;
  }

  async findById(id) {
    const components = await this.loadComponents();
    return components.find((component) => component.id === id) || null;
  }

  async update(id, updates) {
    const components = await this.loadComponents();
    const index = components.findIndex((component) => component.id === id);

    if (index === -1) {
      return null;
    }

    components[index] = { ...components[index], ...updates };
    await this.saveComponents(components);

    return components[index];
  }

  async delete(id) {
    const components = await this.loadComponents();
    const index = components.findIndex((component) => component.id === id);

    if (index === -1) {
      return false;
    }

    components.splice(index, 1);
    await this.saveComponents(components);

    return true;
  }

  async findAll({ limit = 10, offset = 0 } = {}) {
    const components = await this.loadComponents();

    // Sort by updatedAt descending (most recent first)
    const sortedComponents = components.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    const paginatedComponents = sortedComponents.slice(offset, offset + limit);

    return {
      components: paginatedComponents,
      total: components.length,
    };
  }

  async search(query, { limit = 10, offset = 0 } = {}) {
    const components = await this.loadComponents();

    const filteredComponents = components.filter(
      (component) =>
        component.title.toLowerCase().includes(query.toLowerCase()) ||
        component.description.toLowerCase().includes(query.toLowerCase()) ||
        component.code.toLowerCase().includes(query.toLowerCase())
    );

    const sortedComponents = filteredComponents.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    const paginatedComponents = sortedComponents.slice(offset, offset + limit);

    return {
      components: paginatedComponents,
      total: filteredComponents.length,
    };
  }

  async getStats() {
    const components = await this.loadComponents();

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      total: components.length,
      createdToday: components.filter((c) => new Date(c.createdAt) > oneDayAgo)
        .length,
      createdThisWeek: components.filter(
        (c) => new Date(c.createdAt) > oneWeekAgo
      ).length,
      createdThisMonth: components.filter(
        (c) => new Date(c.createdAt) > oneMonthAgo
      ).length,
      updatedToday: components.filter((c) => new Date(c.updatedAt) > oneDayAgo)
        .length,
    };
  }
}

module.exports = ComponentService;
