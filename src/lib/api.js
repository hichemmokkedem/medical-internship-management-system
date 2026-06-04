const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const uploadDocument = async (
    file,
    applicationId,
    documentType,
    userId
) => {
    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('applicationId', applicationId);
    formData.append('documentType', documentType);
    formData.append('userId', userId);

    const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error('Server error response:', errorData);
        throw new Error(`Upload failed: ${errorData}`);
    }
    return response.json();
};

export const getMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${path}`;
};


export const getApplicationDocuments = async (applicationId) => {
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(
            `${API_BASE_URL}/applications/${applicationId}/documents`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        // إذا حصل خطأ HTTP مثل 404 أو 500
        if (!response.ok) {
            const errorText = await response.text(); // نص الخطأ من السيرفر
            console.error('Server error response:', errorText);
            throw new Error(`Failed to fetch documents: ${errorText}`);
        }

        // حاول تحويل الرد إلى JSON
        const data = await response.json();

        // تحقق أن البيانات صحيحة
        if (!data.documents) {
            console.warn('No documents field in response:', data);
            return [];
        }

        console.log('Documents fetched successfully:', data.documents); // ✅ يظهر في console
        return data.documents;

    } catch (err) {
        // أي خطأ آخر، سواء fetch فشل أو JSON فشل
        console.error('Error fetching application documents:', err);
        throw err; // يمكن التعامل مع هذا الخطأ في React component
    }
};

export const recordAttendance = async (
    applicationId,
    date,
    status,
    notes,
    recordedBy
) => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/attendance`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            application: applicationId,
            date,
            status,
            notes,
            recorded_by: recordedBy,
        }),
    });

    if (!response.ok) throw new Error('Failed to record attendance');
    const data = await response.json();
    return data.attendance;
};

export const getAttendanceRecords = async (
    applicationId
) => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/attendance`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error('Failed to fetch attendance');
    const data = await response.json();
    return data.attendance;
};

export const updateAttendanceRecord = async (
    id,
    status,
    notes
) => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/attendance/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, notes }),
    });

    if (!response.ok) throw new Error('Failed to update attendance');
    const data = await response.json();
    return data.attendance;
};

export const getStudentDocuments = async () => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/student/documents`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error('Failed to fetch user documents');
    const data = await response.json();
    return data.documents;
};

export const reuseDocument = async (applicationId, documentId) => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/reuse-document`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ applicationId, documentId })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reuse document');
    }
    return response.json();
};
