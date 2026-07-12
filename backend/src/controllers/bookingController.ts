import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid'; // We need uuid for generating mock IDs

// In-memory mock data
let mockBookings: any[] = [
  {
    id: 'booking-1',
    asset_id: 'asset-1',
    asset_name: 'Dell XPS 15',
    employee_id: 'mock-employee-123',
    employee_name: 'Mock Employee',
    start_time: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
    end_time: new Date(new Date().setHours(17, 0, 0, 0)).toISOString(),
    status: 'confirmed'
  }
];

export const getBookings = async (req: Request, res: Response) => {
  try {
    const { asset_id } = req.query;
    let filteredBookings = mockBookings.filter(b => b.status !== 'cancelled');
    
    if (asset_id) {
      filteredBookings = filteredBookings.filter(b => b.asset_id === asset_id);
    }
    
    res.json(filteredBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

export const createBooking = async (req: Request, res: Response) => {
  try {
    const { asset_id, start_time, end_time } = req.body;
    const employee_id = req.user?.id || 'mock-employee-123';
    
    const newStart = new Date(start_time).getTime();
    const newEnd = new Date(end_time).getTime();

    // Overlap prevention logic (Mock DB)
    const hasOverlap = mockBookings.some(b => {
      if (b.asset_id !== asset_id || b.status === 'cancelled') return false;
      const existStart = new Date(b.start_time).getTime();
      const existEnd = new Date(b.end_time).getTime();
      
      // Overlap condition: (StartA < EndB) and (EndA > StartB)
      return (newStart < existEnd && newEnd > existStart);
    });

    if (hasOverlap) {
      return res.status(409).json({ error: 'This time slot is already booked.' });
    }

    const newBooking = {
      id: uuidv4(),
      asset_id,
      asset_name: 'Mock Asset ' + asset_id.substring(0, 4), // Placeholder name
      employee_id,
      employee_name: req.user?.name || 'Mock Employee',
      start_time,
      end_time,
      status: 'confirmed'
    };

    mockBookings.push(newBooking);
    res.status(201).json(newBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = mockBookings.find(b => b.id === id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    booking.status = 'cancelled';
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};
