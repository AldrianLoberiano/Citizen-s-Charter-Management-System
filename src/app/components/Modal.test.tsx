import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Modal } from "./Modal";

describe("Modal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: "Test Modal",
    children: <p>Modal content</p>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when isOpen is false", () => {
    const { container } = render(<Modal {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders modal when isOpen is true", () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("displays the title", () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByRole("heading", { name: "Test Modal" })).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(<Modal {...defaultProps} />);
    const closeBtn = screen.getByRole("button");
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    render(<Modal {...defaultProps} />);
    const backdrop = document.querySelector(".bg-black\\/50");
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on Escape key press", () => {
    render(<Modal {...defaultProps} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose for non-Escape keys", () => {
    render(<Modal {...defaultProps} />);
    fireEvent.keyDown(document, { key: "Enter" });
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it("applies correct size class for sm", () => {
    render(<Modal {...defaultProps} size="sm" />);
    const modal = screen.getByText("Modal content").closest(".relative");
    expect(modal?.className).toContain("max-w-sm");
  });

  it("applies correct size class for xl", () => {
    render(<Modal {...defaultProps} size="xl" />);
    const modal = screen.getByText("Modal content").closest(".relative");
    expect(modal?.className).toContain("max-w-2xl");
  });

  it("sets body overflow to hidden when open", () => {
    render(<Modal {...defaultProps} />);
    expect(document.body.style.overflow).toBe("hidden");
  });
});