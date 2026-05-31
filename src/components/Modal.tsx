"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";
import { FiX } from "react-icons/fi";

export function Modal({
	open,
	onClose,
	title,
	children,
}: {
	open: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
}) {
	return (
		<AnimatePresence>
			{open && (
				<motion.div
					className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={onClose}
				>
					<motion.div
						className="w-full max-w-md rounded-2xl border border-white/10 bg-tuned p-6 shadow-2xl"
						initial={{ scale: 0.94, y: 16 }}
						animate={{ scale: 1, y: 0 }}
						exit={{ scale: 0.94, y: 16 }}
						transition={{ type: "spring", stiffness: 300, damping: 26 }}
						onClick={(e) => e.stopPropagation()}
					>
						<div className="mb-4 flex items-center justify-between">
							<h3 className="text-lg font-bold">{title}</h3>
							<button
								onClick={onClose}
								className="rounded-lg p-1.5 text-white/50 hover:bg-white/5 hover:text-white"
							>
								<FiX size={18} />
							</button>
						</div>
						{children}
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
