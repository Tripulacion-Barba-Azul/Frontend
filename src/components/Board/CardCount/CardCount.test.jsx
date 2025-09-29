import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CardCount from './CardCount'; 

describe('CardCount Component', () => {

  it('validates number to be at least 0 when negative number is passed', () => {
    render(<CardCount number={-5} />);
    const image = screen.getByAltText('Card Icon');
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(image).toBeInTheDocument();
  });

  it('validates number to be at most 6 when number greater than 6 is passed', () => {
    render(<CardCount number={10} />);
    const image = screen.getByAltText('Card Icon');
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(image).toBeInTheDocument();
  });

  it('renders with number 0', () => {
    render(<CardCount number={0} />);
    const image = screen.getByAltText('Card Icon');
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(image).toBeInTheDocument();
  });

  it('renders with number 1', () => {
    render(<CardCount number={1} />);
    const image = screen.getByAltText('Card Icon');
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(image).toBeInTheDocument();
  });

  it('renders with number 2', () => {
    render(<CardCount number={2} />);
    const image = screen.getByAltText('Card Icon');
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(image).toBeInTheDocument();
  });

  it('renders with number 3', () => {
    render(<CardCount number={3} />);
    const image = screen.getByAltText('Card Icon');
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(image).toBeInTheDocument();
  });

  it('renders with number 4', () => {
    render(<CardCount number={4} />);
    const image = screen.getByAltText('Card Icon');
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(image).toBeInTheDocument();
  });

  it('renders with number 5', () => {
    render(<CardCount number={5} />);
    const image = screen.getByAltText('Card Icon');
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(image).toBeInTheDocument();
  });

  it('renders with number 6', () => {
    render(<CardCount number={6} />);
    const image = screen.getByAltText('Card Icon');
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(image).toBeInTheDocument();
  });

});