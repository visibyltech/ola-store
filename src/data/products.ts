import productFridge from "@/assets/product-fridge.jpg";
import productTv from "@/assets/product-tv.jpg";
import productWasher from "@/assets/product-washer.jpg";
import productAc from "@/assets/product-ac.jpg";

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  installmentPrice: number;
  description: string;
  image: string;
  features: string[];
  available: boolean;
  minDeposit: number;
  maxInstallmentMonths: number;
}

export const categories = [
  { name: "Televisions", icon: "📺", count: 24 },
  { name: "Refrigerators", icon: "🧊", count: 18 },
  { name: "Washing Machines", icon: "🫧", count: 15 },
  { name: "Air Conditioners", icon: "❄️", count: 12 },
  { name: "Microwaves", icon: "🍽️", count: 8 },
  { name: "Generators", icon: "⚡", count: 6 },
];

export const products: Product[] = [
  {
    id: "1",
    name: "Hisense 55\" 4K Smart TV",
    brand: "Hisense",
    category: "Televisions",
    price: 285000,
    installmentPrice: 285000,
    description: "Experience stunning 4K UHD resolution with Hisense's advanced VIDAA smart platform. Dolby Vision HDR for lifelike picture quality.",
    image: productTv,
    features: ["4K UHD Resolution", "Dolby Vision HDR", "VIDAA Smart OS", "Bluetooth 5.0"],
    available: true,
    minDeposit: 50000,
    maxInstallmentMonths: 6,
  },
  {
    id: "2",
    name: "Hisense 500L French Door Fridge",
    brand: "Hisense",
    category: "Refrigerators",
    price: 450000,
    installmentPrice: 450000,
    description: "Spacious French door refrigerator with multi-airflow cooling, inverter compressor and frost-free technology.",
    image: productFridge,
    features: ["500L Capacity", "Inverter Compressor", "Multi-Airflow", "Frost Free"],
    available: true,
    minDeposit: 100000,
    maxInstallmentMonths: 9,
  },
  {
    id: "3",
    name: "Samsung 9kg Front Load Washer",
    brand: "Samsung",
    category: "Washing Machines",
    price: 320000,
    installmentPrice: 320000,
    description: "Advanced front-loading washing machine with EcoBubble technology for powerful yet gentle cleaning.",
    image: productWasher,
    features: ["9kg Capacity", "EcoBubble", "Digital Inverter", "Steam Wash"],
    available: true,
    minDeposit: 60000,
    maxInstallmentMonths: 6,
  },
  {
    id: "4",
    name: "Hisense 1.5HP Split AC",
    brand: "Hisense",
    category: "Air Conditioners",
    price: 195000,
    installmentPrice: 195000,
    description: "Energy-efficient split air conditioner with fast cooling, copper condenser and low noise operation.",
    image: productAc,
    features: ["1.5HP Capacity", "Fast Cooling", "Copper Condenser", "Low Noise"],
    available: true,
    minDeposit: 40000,
    maxInstallmentMonths: 6,
  },
];

export const formatPrice = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const calculateInstallment = (price: number, deposit: number) => {
  const depositPercentage = deposit / price;
  const interestRate = depositPercentage >= 0.5 ? 0.1 : 0.3;
  const totalPayable = price + price * interestRate;
  const balance = totalPayable - deposit;
  return { totalPayable, balance, interestRate, interestAmount: price * interestRate };
};
