import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    totalItems: 50,
    itemsPerPage: 10,
    onPageChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when totalPages <= 1", () => {
    const { container } = render(
      <Pagination {...defaultProps} totalPages={1} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("displays correct item range text", () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByText(/Showing 1/)).toBeInTheDocument();
    expect(screen.getByText(/10 of 50 entries/)).toBeInTheDocument();
  });

  it("displays correct range for page 2", () => {
    render(<Pagination {...defaultProps} currentPage={2} />);
    expect(screen.getByText(/Showing 11/)).toBeInTheDocument();
    expect(screen.getByText(/20 of 50 entries/)).toBeInTheDocument();
  });

  it("calls onPageChange when next button is clicked", () => {
    render(<Pagination {...defaultProps} />);
    const nextButtons = screen.getAllByRole("button");
    const nextBtn = nextButtons[nextButtons.length - 1];
    fireEvent.click(nextBtn);
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange when previous button is clicked", () => {
    render(<Pagination {...defaultProps} currentPage={3} />);
    const prevBtn = screen.getAllByRole("button")[0];
    fireEvent.click(prevBtn);
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
  });

  it("disables previous button on first page", () => {
    render(<Pagination {...defaultProps} currentPage={1} />);
    const prevBtn = screen.getAllByRole("button")[0];
    expect(prevBtn).toBeDisabled();
  });

  it("disables next button on last page", () => {
    render(<Pagination {...defaultProps} currentPage={5} />);
    const buttons = screen.getAllByRole("button");
    const nextBtn = buttons[buttons.length - 1];
    expect(nextBtn).toBeDisabled();
  });

  it("calls onPageChange when a page number is clicked", () => {
    render(<Pagination {...defaultProps} />);
    const page2Btn = screen.getByText("2");
    fireEvent.click(page2Btn);
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
  });

  it("highlights current page", () => {
    render(<Pagination {...defaultProps} currentPage={3} />);
    const page3Btn = screen.getByText("3");
    expect(page3Btn.className).toContain("bg-violet-900");
  });

  it("shows ellipsis for large page counts", () => {
    render(<Pagination {...defaultProps} totalPages={20} currentPage={10} />);
    const ellipses = screen.getAllByText("...");
    expect(ellipses.length).toBeGreaterThanOrEqual(1);
  });
});