import { render, screen, fireEvent } from '@testing-library/react';
import { DuplicateModal } from './DuplicateModal';

describe('DuplicateModal', () => {
  const mockFindings = [
    { id: '1', title: 'SQL Injection on API', asset_name: 'Payment API', severity: 'Critical' },
    { id: '2', title: 'SQL Injection on API', asset_name: 'Payment API', severity: 'Critical' }
  ];

  it('should render modal with duplicate group', () => {
    const { container } = render(
      <DuplicateModal findings={mockFindings} isOpen={true} onClose={() => {}} />
    );
    expect(screen.getByText('Manage Duplicates')).toBeInTheDocument();
  });

  it('should show selection UI for master finding', () => {
    render(
      <DuplicateModal findings={mockFindings} isOpen={true} onClose={() => {}} />
    );
    expect(screen.getByText('Select Master Finding')).toBeInTheDocument();
  });

  it('should call onMerge when merge button clicked', () => {
    const onMerge = jest.fn();
    render(
      <DuplicateModal
        findings={mockFindings}
        isOpen={true}
        onClose={() => {}}
        onMerge={onMerge}
      />
    );

    fireEvent.click(screen.getByText('Merge Findings'));
    expect(onMerge).toHaveBeenCalled();
  });

  it('should display all findings in master selection', () => {
    render(
      <DuplicateModal findings={mockFindings} isOpen={true} onClose={() => {}} />
    );

    mockFindings.forEach(finding => {
      expect(screen.getByText(finding.title)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(finding.asset_name))).toBeInTheDocument();
    });
  });

  it('should update duplicate list when master selection changes', () => {
    render(
      <DuplicateModal findings={mockFindings} isOpen={true} onClose={() => {}} />
    );

    expect(screen.getByText('Duplicates to Merge (1)')).toBeInTheDocument();

    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]);

    expect(screen.getByText('Duplicates to Merge (1)')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <DuplicateModal findings={mockFindings} isOpen={false} onClose={() => {}} />
    );

    expect(container.querySelector('.fixed')).not.toBeInTheDocument();
  });

  it('should call onClose when close button clicked', () => {
    const onClose = jest.fn();
    render(
      <DuplicateModal findings={mockFindings} isOpen={true} onClose={onClose} />
    );

    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose after merge', () => {
    const onClose = jest.fn();
    const onMerge = jest.fn();
    render(
      <DuplicateModal
        findings={mockFindings}
        isOpen={true}
        onClose={onClose}
        onMerge={onMerge}
      />
    );

    fireEvent.click(screen.getByText('Merge Findings'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should show correct duplicate count', () => {
    const threeFindings = [
      { id: '1', title: 'Finding 1', asset_name: 'Asset 1', severity: 'Critical' },
      { id: '2', title: 'Finding 2', asset_name: 'Asset 1', severity: 'Critical' },
      { id: '3', title: 'Finding 3', asset_name: 'Asset 1', severity: 'Critical' }
    ];

    render(
      <DuplicateModal findings={threeFindings} isOpen={true} onClose={() => {}} />
    );

    expect(screen.getByText('Duplicates to Merge (2)')).toBeInTheDocument();
  });

  it('should display result explanation box', () => {
    render(
      <DuplicateModal findings={mockFindings} isOpen={true} onClose={() => {}} />
    );

    expect(screen.getByText(/master finding will be marked as unique/i)).toBeInTheDocument();
    expect(screen.getByText(/Duplicates will be linked to it/i)).toBeInTheDocument();
  });
});
