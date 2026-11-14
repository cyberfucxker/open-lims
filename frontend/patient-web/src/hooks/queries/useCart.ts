import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { cartApi } from "@/services/api/cartApi";
import { catalogApi } from "@/services/api/catalogApi";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useAuthGate } from "@/hooks/useAuthGate";
import type { AddToCartRequest, RemoveCartRequest } from "@/types";

export const CART_QUERY_KEY = ["cart"];

export function useCart() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setItemCount = useCartStore((s) => s.setItemCount);

  // Guests have no server-side cart to fetch — Home/Catalog render this via
  // FloatingCartBar now that browsing doesn't require login, so skip the
  // doomed-to-401 request rather than firing it on every guest page view.
  const query = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: cartApi.getCart,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (query.data) setItemCount(query.data.cartItems.length);
  }, [query.data, setItemCount]);

  return query;
}

export function useAddToCart() {
  const { requireAuth } = useAuthGate();
  const queryClient = useQueryClient();
  const bumpLastAdded = useCartStore((s) => s.bumpLastAdded);

  const mutation = useMutation({
    mutationFn: (payload: AddToCartRequest) => catalogApi.addToCart(payload),
    onSuccess: () => {
      bumpLastAdded();
      toast.success("Added to cart");
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["home"] });
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
    onError: () => toast.error("Could not add item to cart"),
  });

  // A guest tapping "Add to Cart" on a public page opens the auth sheet in
  // place and the add runs the moment they finish — no route change, so they
  // keep their scroll position in a long catalogue and never have to find
  // their way back and tap the button a second time.
  function mutate(payload: AddToCartRequest) {
    requireAuth(() => mutation.mutate(payload), "Log in to add this to your cart.");
  }

  return { ...mutation, mutate };
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RemoveCartRequest) => cartApi.removeCartItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["home"] });
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
    onError: () => toast.error("Could not remove item"),
  });
}

export function useApplyCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (couponCode: string) => cartApi.applyCoupon(couponCode),
    onSuccess: (result) => {
      if (result.status) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      } else {
        toast.error(result.message);
      }
    },
  });
}

export function useSetCartFamilyMember() {
  return useMutation({
    mutationFn: (familyMemberId: string) => cartApi.setFamilyMember(familyMemberId),
    onError: (error) => {
      toast.error(
        error instanceof ApiRequestError
          ? error.message
          : "Could not update the booking's family member",
      );
    },
  });
}

export function useRemoveCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cartApi.removeCoupon(),
    onSuccess: () => {
      toast.success("Coupon removed");
      return queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(error instanceof ApiRequestError ? error.message : "Could not remove coupon");
    },
  });
}
