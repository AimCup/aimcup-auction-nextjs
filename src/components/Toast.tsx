"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";
import { FiAlertCircle, FiCheckCircle, FiInfo } from "react-icons/fi";

type ToastType = "success" | "error" | "info";
interface ToastItem {
	id: number;
	message: string;
	type: ToastType;
}

const ToastContext = createContext<(message: string, type?: ToastType) => void>(
	() => {},
);

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);

	const toast = useCallback((message: string, type: ToastType = "info") => {
		const id = Date.now() + Math.random();
		setToasts((current) => [...current, { id, message, type }]);
		setTimeout(
			() => setToasts((current) => current.filter((t) => t.id !== id)),
			4200,
		);
	}, []);

	return (
		<ToastContext.Provider value={toast}>
			{children}
			<div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
				<AnimatePresence>
					{toasts.map((t) => (
						<motion.div
							key={t.id}
							initial={{ opacity: 0, x: 40, scale: 0.9 }}
							animate={{ opacity: 1, x: 0, scale: 1 }}
							exit={{ opacity: 0, x: 40, scale: 0.9 }}
							transition={{ type: "spring", stiffness: 320, damping: 26 }}
							className={`glass pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm shadow-xl ${
								t.type === "error"
									? "border-deepRed/50"
									: t.type === "success"
										? "border-mintGreen/50"
										: "border-white/10"
							}`}
						>
							<span
								className={
									t.type === "error"
										? "text-deepRed"
										: t.type === "success"
											? "text-mintGreen"
											: "text-white/70"
								}
							>
								{t.type === "error" ? (
									<FiAlertCircle size={18} />
								) : t.type === "success" ? (
									<FiCheckCircle size={18} />
								) : (
									<FiInfo size={18} />
								)}
							</span>
							<span className="text-white/90">{t.message}</span>
						</motion.div>
					))}
				</AnimatePresence>
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	return useContext(ToastContext);
}
