import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../api/axios';
import { 
  Card, 
  Form, 
  Button, 
  Spinner, 
  Row, 
  Col, 
  Alert,
  Tabs,
  Tab,
  Badge
} from 'react-bootstrap';
import { 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaSave, 
  FaKey, 
  FaUserEdit,
  FaCamera,
  FaTimes
} from 'react-icons/fa';

const AdminProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState('');

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const response = await api.get('/auth/me');
        setAdmin(response.data.user);
        setPreviewImage(response.data.user.avatar || '');
      } catch (err) {
        console.error('Error fetching admin profile:', err);
        toast.error('Failed to load admin profile');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, []);

  const profileForm = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: admin?.name || '',
      email: admin?.email || '',
      department: admin?.adminMeta?.department || '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      department: Yup.string().required('Department is required'),
    }),
    onSubmit: async (values) => {
      try {
        setSaving(true);
        const formData = new FormData();
        
        // Append profile data
        formData.append('name', values.name);
        formData.append('email', values.email);
        formData.append('adminMeta', JSON.stringify({
          ...admin.adminMeta,
          department: values.department
        }));
        
        // Append profile image if selected
        if (profileImage) {
          formData.append('profilePhoto', profileImage);
        }

        const response = await api.put('/auth/update-profile', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setAdmin(response.data.user);
        setPreviewImage(response.data.user.avatar || '');
        toast.success('Profile updated successfully');
      } catch (err) {
        console.error('Error updating profile:', err);
        toast.error(err.response?.data?.message || 'Failed to update profile');
      } finally {
        setSaving(false);
      }
    },
  });

  const passwordForm = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required('Current password is required'),
      newPassword: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('New password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
        .required('Please confirm your password'),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        setSaving(true);
        await api.put('/auth/update-password', {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        
        resetForm();
        toast.success('Password updated successfully');
      } catch (err) {
        console.error('Error updating password:', err);
        toast.error(err.response?.data?.message || 'Failed to update password');
      } finally {
        setSaving(false);
      }
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfileImage = async () => {
    try {
      setSaving(true);
      const response = await api.delete('/auth/remove-profile-image');
      setAdmin(response.data.user);
      setPreviewImage('');
      setProfileImage(null);
      toast.success('Profile image removed');
    } catch (err) {
      console.error('Error removing profile image:', err);
      toast.error('Failed to remove profile image');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!admin) {
    return <Alert variant="danger">Failed to load admin profile</Alert>;
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Profile</h2>
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
        id="admin-profile-tabs"
      >
        <Tab eventKey="profile" title={
          <span><FaUserEdit className="me-1" /> Profile</span>
        }>
          <Card className="mt-3">
            <Card.Body>
              <Form onSubmit={profileForm.handleSubmit}>
                <Row>
                  <Col md={4} className="text-center mb-4">
                    <div className="position-relative d-inline-block">
                      <div 
                        className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto" 
                        style={{ 
                          width: '200px', 
                          height: '200px', 
                          overflow: 'hidden',
                          border: '1px solid #dee2e6'
                        }}
                      >
                        {previewImage ? (
                          <img 
                            src={previewImage} 
                            alt={admin.name} 
                            className="img-fluid"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <FaUser size={80} className="text-muted" />
                        )}
                      </div>
                      <div className="mt-3">
                        <input
                          type="file"
                          id="profileImage"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="d-none"
                        />
                        <Button
                          as="label"
                          htmlFor="profileImage"
                          variant="outline-primary"
                          className="me-2"
                        >
                          <FaCamera className="me-1" /> Change
                        </Button>
                        {previewImage && (
                          <Button
                            variant="outline-danger"
                            onClick={(e) => {
                              e.preventDefault();
                              removeProfileImage();
                            }}
                            disabled={saving}
                          >
                            <FaTimes className="me-1" /> Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      <h4>{admin.name}</h4>
                      <Badge bg="info">{admin.role?.toUpperCase()}</Badge>
                      {admin.status === 'active' ? (
                        <Badge bg="success" className="ms-1">ACTIVE</Badge>
                      ) : (
                        <Badge bg="danger" className="ms-1">INACTIVE</Badge>
                      )}
                      <div className="text-muted mt-2">
                        <small>ID: {admin.adminId || 'N/A'}</small>
                      </div>
                    </div>
                  </Col>
                  <Col md={8}>
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="name">
                          <Form.Label>Full Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={profileForm.values.name}
                            onChange={profileForm.handleChange}
                            onBlur={profileForm.handleBlur}
                            isInvalid={profileForm.touched.name && !!profileForm.errors.name}
                          />
                          <Form.Control.Feedback type="invalid">
                            {profileForm.errors.name}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="email">
                          <Form.Label>Email Address</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={profileForm.values.email}
                            onChange={profileForm.handleChange}
                            onBlur={profileForm.handleBlur}
                            isInvalid={profileForm.touched.email && !!profileForm.errors.email}
                          />
                          <Form.Control.Feedback type="invalid">
                            {profileForm.errors.email}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-4" controlId="department">
                      <Form.Label>Department</Form.Label>
                      <Form.Control
                        type="text"
                        name="department"
                        value={profileForm.values.department}
                        onChange={profileForm.handleChange}
                        onBlur={profileForm.handleBlur}
                        isInvalid={profileForm.touched.department && !!profileForm.errors.department}
                      />
                      <Form.Control.Feedback type="invalid">
                        {profileForm.errors.department}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <div className="d-flex justify-content-end">
                      <Button 
                        type="submit" 
                        variant="primary"
                        disabled={saving || !profileForm.dirty}
                      >
                        {saving ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave className="me-1" /> Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="password" title={
          <span><FaKey className="me-1" /> Change Password</span>
        }>
          <Card className="mt-3">
            <Card.Body>
              <Form onSubmit={passwordForm.handleSubmit}>
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3" controlId="currentPassword">
                      <Form.Label>Current Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="currentPassword"
                        value={passwordForm.values.currentPassword}
                        onChange={passwordForm.handleChange}
                        onBlur={passwordForm.handleBlur}
                        isInvalid={passwordForm.touched.currentPassword && !!passwordForm.errors.currentPassword}
                      />
                      <Form.Control.Feedback type="invalid">
                        {passwordForm.errors.currentPassword}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="newPassword">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="newPassword"
                        value={passwordForm.values.newPassword}
                        onChange={passwordForm.handleChange}
                        onBlur={passwordForm.handleBlur}
                        isInvalid={passwordForm.touched.newPassword && !!passwordForm.errors.newPassword}
                      />
                      <Form.Text className="text-muted">
                        Password must be at least 8 characters long
                      </Form.Text>
                      <Form.Control.Feedback type="invalid">
                        {passwordForm.errors.newPassword}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="confirmPassword">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={passwordForm.values.confirmPassword}
                        onChange={passwordForm.handleChange}
                        onBlur={passwordForm.handleBlur}
                        isInvalid={passwordForm.touched.confirmPassword && !!passwordForm.errors.confirmPassword}
                      />
                      <Form.Control.Feedback type="invalid">
                        {passwordForm.errors.confirmPassword}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <div className="d-flex justify-content-end">
                      <Button 
                        type="submit" 
                        variant="primary"
                        disabled={saving || !passwordForm.dirty}
                      >
                        {saving ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Updating...
                          </>
                        ) : (
                          <>
                            <FaLock className="me-1" /> Update Password
                          </>
                        )}
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default AdminProfile;
