import { render } from '@testing-library/react';
import { Dice3D } from '../Dice3D';

describe('Dice3D', () => {
  it('renders a dice scene container', () => {
    const { container } = render(
      <Dice3D targetValue={1} rolling={false} settleDelay={0} />
    );
    expect(container.querySelector('.dice3d-scene')).toBeInTheDocument();
  });

  it('renders six faces', () => {
    const { container } = render(
      <Dice3D targetValue={3} rolling={false} settleDelay={0} />
    );
    const faces = container.querySelectorAll('.dice3d__face');
    expect(faces).toHaveLength(6);
  });

  it('renders correct number of pips on each face', () => {
    const { container } = render(
      <Dice3D targetValue={1} rolling={false} settleDelay={0} />
    );
    const faces = container.querySelectorAll('.dice3d__face');
    const expectedPips = [1, 2, 3, 4, 5, 6];
    faces.forEach((face, i) => {
      const pips = face.querySelectorAll('.dice3d__pip');
      expect(pips).toHaveLength(expectedPips[i]);
    });
  });

  it('has the correct face CSS classes', () => {
    const { container } = render(
      <Dice3D targetValue={4} rolling={false} settleDelay={0} />
    );
    for (let f = 1; f <= 6; f++) {
      expect(container.querySelector(`.dice3d__face--${f}`)).toBeInTheDocument();
    }
  });

  it('accepts an onSettled callback prop', () => {
    const onSettled = vi.fn();
    const { container } = render(
      <Dice3D targetValue={6} rolling={false} settleDelay={0} onSettled={onSettled} />
    );
    expect(container.querySelector('.dice3d-scene')).toBeInTheDocument();
    expect(onSettled).not.toHaveBeenCalled();
  });
});
