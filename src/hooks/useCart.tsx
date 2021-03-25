import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    let storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) return JSON.parse(storagedCart);
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get(`products/${productId}`);
      let product = cart.find((product) => product.id === productId);

      if (product) {
        updateProductAmount({
          productId,
          amount: product.amount + 1,
        });
      }

      const updatedCart = [...cart, { ...data, amount: 1 }];
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      setCart(updatedCart);
    } catch (err) {
      toast.error('Erro na adição do produto');
      toast.error('Quantidade solicitada fora de estoque');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = cart.find((product) => product.id === productId);
      if (!product) {
        return toast.error('Erro na remoção do produto');
      }
      let updatedCart = cart.filter((product) => product.id !== productId);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      setCart(updatedCart);
    } catch (err) {
      toast.error('Erro na remoção do produto');
    }
  };
  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data } = await api.get<Stock>(`stock/${productId}`);
      if (amount > data.amount || amount < 1) {
        // Sem essa logica, ele dá erro no carrinho
        // permitindo passar mais um valor alem do que foi permitido
        // setCart(cart);
        // localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      let updatedCart = [...cart].filter((product) => {
        if (product.id === productId) product.amount = amount++;
        return product;
      });
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      setCart(updatedCart);
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
