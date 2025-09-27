import {render, screen} from '@testing-library/react'
import '@testing-library/jest-dom';
import TitleScreen from './TitleScreen';

describe('TitleScreen', () => {
    it('Title should render', () =>{
        render(<TitleScreen />);

        const title = screen.getByText("Aghata Christie's Death on the Cards")
        expect(title).toBeInTheDocument();
    });
    it('Button Create Game should render', () =>{
        render(<TitleScreen />);

        const CGButton = screen.getByText('Create Game')
        expect(CGButton).toBeInTheDocument();
    })
    it('Button Join Game should render', () =>{
        render(<TitleScreen />);

        const JGButton = screen.getByText('Join Game')
        expect(JGButton).toBeInTheDocument();
    })
})