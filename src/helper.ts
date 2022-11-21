export const string2array = (str: string, separator: string): string[] => {
  return str
    .split(separator)
    .filter(Boolean)
    .map(s => s.trim());
};

export const replitDatabase = () => {
  const Database = require('@replit/database');
  const db = new Database();
  const insert = async (key: string, value: any) => {
    return db.set(key, value);
  };
  const get = async (key: string) => {
    return db.get(key);
  };
  const remove = async (key: string) => {
    return db.delete(key);
  };
  const list = async () => {
    return db.list();
  };
  const clear = async () => {
    return db.clear();
  };
  return { insert, get };
};
